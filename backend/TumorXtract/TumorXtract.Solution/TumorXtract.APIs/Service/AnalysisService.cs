using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net.Http;
// Removed System.Net.Http.Json as we are using System.Text.Json for deserialization
using System.Text.Json; // For JsonSerializer
using System.Threading.Tasks;
using TumorXtract.APIs.DTOs;    // Ensure this using directive points to your DTOs' namespace
using TumorXtract.APIs.Service;
using TumorXtract.Core;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Repositories;
using TumorXtract.Core.Services;
using TumorXtract.Core.Specifications;

namespace TumorXtract.Service
{
    public class AnalysisService : IAnalysisService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IFileService _fileService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ITemporaryAnalysisRepository _temporaryAnalysisRepository;
        private readonly ILogger<AnalysisService> _logger;

        public AnalysisService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IFileService fileService,
            IWebHostEnvironment webHostEnvironment,
            ITemporaryAnalysisRepository temporaryAnalysisRepository,
            ILogger<AnalysisService> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _fileService = fileService;
            _webHostEnvironment = webHostEnvironment;
            _temporaryAnalysisRepository = temporaryAnalysisRepository;
            _logger = logger;
        }

        public async Task<AnalysisDetectionResponseDto?> PerformDetectionAsync(IFormFile file) // Parameter name changed to 'file'
        {
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("PerformDetectionAsync called with no file."); // Log message updated
                return null;
            }

            var flaskApiUrl = _configuration["FlaskAIService:PredictUrl"];
            if (string.IsNullOrEmpty(flaskApiUrl))
            {
                _logger.LogError("Flask AI Service URL ('FlaskAIService:PredictUrl') is not configured.");
                throw new InvalidOperationException("Flask AI Service URL not configured.");
            }

            var client = _httpClientFactory.CreateClient("FlaskAIService");
            TemporaryAnalysis tempAnalysisResult;

            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                using (var formData = new MultipartFormDataContent())
                {
                    // The key "file" here is for the Flask API request
                    formData.Add(new ByteArrayContent(fileBytes), "file", file.FileName);

                    HttpResponseMessage response;
                    try
                    {
                        _logger.LogInformation("Calling Flask API at {FlaskUrl} for image: {FileName}", flaskApiUrl, file.FileName);
                        response = await client.PostAsync(flaskApiUrl, formData);
                        response.EnsureSuccessStatusCode();
                    }
                    catch (HttpRequestException ex)
                    {
                        _logger.LogError(ex, "Error calling Flask API at {FlaskUrl}. Status: {StatusCode}", flaskApiUrl, ex.StatusCode);
                        return null;
                    }

                    FlaskPredictionResponse? flaskResponse = null;
                    string rawContent = string.Empty;
                    try
                    {
                        rawContent = await response.Content.ReadAsStringAsync();
                        flaskResponse = JsonSerializer.Deserialize<FlaskPredictionResponse>(rawContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error deserializing Flask API response. Raw content: {RawContent}", rawContent);
                        return null;
                    }

                    // **** CORRECTED ADJUSTED CHECK ****
                    if (flaskResponse == null ||
                        string.IsNullOrEmpty(flaskResponse.prediction) ||
                        flaskResponse.segmentation == null || // Check if segmentation object exists
                        string.IsNullOrEmpty(flaskResponse.segmentation.mask) ||
                        string.IsNullOrEmpty(flaskResponse.segmentation.overlay) ||
                        flaskResponse.ConfidenceScores == null) // Also check if ConfidenceScores is null
                    {
                        _logger.LogWarning("Flask API response was incomplete or missing required fields (prediction, segmentation.mask, segmentation.overlay, or confidence_scores). Raw content: {RawContent}", rawContent);
                        return null;
                    }

                    // Serialize the ConfidenceScores dictionary to a JSON string
                    string confidenceScoresString = JsonSerializer.Serialize(flaskResponse.ConfidenceScores);

                    tempAnalysisResult = new TemporaryAnalysis
                    {
                        Id = Guid.NewGuid(),
                        OriginalMriFileName = file.FileName,
                        OriginalMriContentType = file.ContentType,
                        OriginalMriData = fileBytes,
                        TumorType = flaskResponse.prediction,
                        ConfidenceScores = confidenceScoresString, // Store the JSON string
                        Base64Mask = flaskResponse.segmentation.mask,     // Access via nested object
                        Base64Overlay = flaskResponse.segmentation.overlay, // Access via nested object
                        CreationTimestamp = DateTime.UtcNow
                    };

                    try
                    {
                        await _temporaryAnalysisRepository.AddAsync(tempAnalysisResult);
                        await _unitOfWork.CompleteAsync();
                    }
                    catch (Exception dbEx)
                    {
                        _logger.LogError(dbEx, "Error saving TemporaryAnalysis to database.");
                        return null;
                    }
                }
            }

            return new AnalysisDetectionResponseDto
            {
                TemporaryAnalysisId = tempAnalysisResult.Id,
                Prediction = tempAnalysisResult.TumorType,
                ConfidenceScores = tempAnalysisResult.ConfidenceScores, // This is now the JSON string
                Base64Mask = tempAnalysisResult.Base64Mask,
                Base64Overlay = tempAnalysisResult.Base64Overlay
            };
        }

        public async Task<AnalysisDto?> LinkAnalysisToPatientAsync(int patientId, Guid temporaryAnalysisId, string requestingDoctorId)
        {
            var patient = await _unitOfWork.Repository<Patient>().GetByIdAsync(patientId);
            if (patient == null || patient.DoctorId != requestingDoctorId)
            {
                _logger.LogWarning("LinkAnalysisToPatientAsync: Patient with ID {PatientId} not found or not managed by Doctor {DoctorId}.", patientId, requestingDoctorId);
                return null;
            }

            var tempAnalysis = await _temporaryAnalysisRepository.GetByIdAsync(temporaryAnalysisId);
            if (tempAnalysis == null)
            {
                _logger.LogWarning("LinkAnalysisToPatientAsync: TemporaryAnalysis with ID {TempAnalysisId} not found.", temporaryAnalysisId);
                return null;
            }

            string patientScanSubfolder = Path.Combine("patient_scans", patientId.ToString(), tempAnalysis.Id.ToString("N"));

            var originalMriRelativePath = await _fileService.SaveImageFromBytesAsync(
                tempAnalysis.OriginalMriData,
                tempAnalysis.OriginalMriFileName,
                patientScanSubfolder);

            var maskBytes = Convert.FromBase64String(tempAnalysis.Base64Mask);
            var maskRelativePath = await _fileService.SaveImageFromBytesAsync(
                maskBytes,
                "mask_" + Path.GetFileNameWithoutExtension(tempAnalysis.OriginalMriFileName) + ".png",
                patientScanSubfolder);

            var overlayBytes = Convert.FromBase64String(tempAnalysis.Base64Overlay);
            var overlayRelativePath = await _fileService.SaveImageFromBytesAsync(
                overlayBytes,
                "overlay_" + Path.GetFileNameWithoutExtension(tempAnalysis.OriginalMriFileName) + ".png",
                patientScanSubfolder);

            if (originalMriRelativePath == null || maskRelativePath == null || overlayRelativePath == null)
            {
                _logger.LogError("LinkAnalysisToPatientAsync: Failed to save one or more analysis images for Patient ID {PatientId}, TempAnalysis ID {TempAnalysisId}.", patientId, temporaryAnalysisId);
                return null;
            }

            double primaryConfidence = 0.0;
            try
            {
                // tempAnalysis.ConfidenceScores is now a JSON string representing the dictionary
                var scoresDocument = JsonDocument.Parse(tempAnalysis.ConfidenceScores);
                if (scoresDocument.RootElement.TryGetProperty(tempAnalysis.TumorType, out JsonElement typeScoreElement) &&
                    typeScoreElement.TryGetDouble(out double parsedTypeScore))
                {
                    primaryConfidence = parsedTypeScore;
                }
                else if (scoresDocument.RootElement.TryGetProperty("score", out JsonElement scoreElement) && // Fallback, if your Flask API might return a simple "score"
                         scoreElement.TryGetDouble(out double parsedScore))
                {
                    primaryConfidence = parsedScore;
                }
                else
                {
                    using (var enumerator = scoresDocument.RootElement.EnumerateObject())
                    {
                        if (enumerator.MoveNext()) 
                        {
                            if (enumerator.Current.Value.TryGetDouble(out double firstScore))
                            {
                                primaryConfidence = firstScore;
                                _logger.LogWarning("Could not find confidence score for TumorType: {TumorType}. Using first available score: {FirstScore}. JSON: {ConfidenceJson}", tempAnalysis.TumorType, firstScore, tempAnalysis.ConfidenceScores);
                            }
                            else
                            {
                                _logger.LogWarning("Could not parse primary confidence score from JSON: {ConfidenceJson} for TumorType: {TumorType}. Defaulting to 0.", tempAnalysis.ConfidenceScores, tempAnalysis.TumorType);
                            }
                        }
                        else
                        {
                            _logger.LogWarning("ConfidenceScores JSON was empty or not an object: {ConfidenceJson}. Defaulting to 0.", tempAnalysis.ConfidenceScores);
                        }
                    }
                }
            }
            catch (JsonException jsonEx)
            {
                _logger.LogWarning(jsonEx, "Failed to parse ConfidenceScores JSON: {ConfidenceJson}. Defaulting Confidence to 0.", tempAnalysis.ConfidenceScores);
            }

            var permanentAnalysis = new Analysis
            {
                PatientId = patientId,
                AnalysisDate = tempAnalysis.CreationTimestamp,
                OriginalMriImagePath = originalMriRelativePath,
                TumorType = tempAnalysis.TumorType,
                Confidence = primaryConfidence,
                ConfidenceScores = tempAnalysis.ConfidenceScores, // Storing the full JSON string
                MaskImagePath = maskRelativePath,
                OverlayImagePath = overlayRelativePath
            };

            await _unitOfWork.Repository<Analysis>().AddAsync(permanentAnalysis);
            _temporaryAnalysisRepository.Delete(tempAnalysis);

            if (await _unitOfWork.CompleteAsync() > 0)
            {
                _logger.LogInformation("Successfully linked TemporaryAnalysis {TempAnalysisId} to Patient {PatientId} as Permanent Analysis {PermanentAnalysisId}.", temporaryAnalysisId, patientId, permanentAnalysis.Id);
                return _mapper.Map<AnalysisDto>(permanentAnalysis);
            }
            _logger.LogError("Failed to save changes when linking TemporaryAnalysis {TempAnalysisId} to Patient {PatientId}.", temporaryAnalysisId, patientId);
            return null;
        }

        public async Task<PatientDto?> CreatePatientWithAnalysisAsync(CreatePatientWithAnalysisDto createDto, string doctorId)
        {
            var patient = _mapper.Map<Patient>(createDto.PatientData);
            patient.DoctorId = doctorId;
            patient.LastVist = DateTime.UtcNow; // Ensure this is correct or set from DTO if needed

            await _unitOfWork.Repository<Patient>().AddAsync(patient);
            if (await _unitOfWork.CompleteAsync() <= 0)
            {
                _logger.LogError("Failed to create new patient profile for Doctor {DoctorId}.", doctorId);
                return null;
            }
            _logger.LogInformation("Patient profile created with ID {PatientId} for Doctor {DoctorId}.", patient.Id, doctorId);

            if (createDto.TemporaryAnalysisId == Guid.Empty)
            {
                _logger.LogWarning("CreatePatientWithAnalysisAsync: TemporaryAnalysisId was Guid.Empty. Skipping analysis linking for Patient {PatientId}.", patient.Id);
                var createdPatientWithoutAnalysis = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(new PatientWithAddressAndAnalysisSpecifications(patient.Id, doctorId));
                return _mapper.Map<PatientDto>(createdPatientWithoutAnalysis);
            }

            var linkedAnalysisDto = await LinkAnalysisToPatientAsync(patient.Id, createDto.TemporaryAnalysisId, doctorId);
            if (linkedAnalysisDto == null)
            {
                _logger.LogWarning("Patient {PatientId} was created, but failed to link TemporaryAnalysis {TempAnalysisId}.", patient.Id, createDto.TemporaryAnalysisId);
                // Decide if you want to return the patient anyway, or null if analysis linking is critical
            }
            var patientSpec = new PatientWithAddressAndAnalysisSpecifications(patient.Id, doctorId);
            var createdPatientWithDetails = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(patientSpec);

            return _mapper.Map<PatientDto>(createdPatientWithDetails);
        }
        private async Task<string?> SaveFileFromBytesAsync(byte[] fileData, string fileName, string subfolder)
        {
            if (fileData == null || fileData.Length == 0) return null;

            var targetFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images", subfolder);
            if (!Directory.Exists(targetFolder))
            {
                Directory.CreateDirectory(targetFolder);
            }

            var fileExtension = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(fileExtension) && (fileName.ToLower().Contains("mask") || fileName.ToLower().Contains("overlay")))
            {
                fileExtension = ".png";
            }
            else if (string.IsNullOrEmpty(fileExtension))
            {
                fileExtension = ".tmp"; // Or a more appropriate default based on MRI file types if not mask/overlay
            }

            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(targetFolder, uniqueFileName);
            try
            {
                await File.WriteAllBytesAsync(filePath, fileData);
                return Path.Combine("images", subfolder, uniqueFileName).Replace('\\', '/');
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving file from bytes. FileName: {FileName}, Subfolder: {Subfolder}", fileName, subfolder);
                return null;
            }
        }
    }
}