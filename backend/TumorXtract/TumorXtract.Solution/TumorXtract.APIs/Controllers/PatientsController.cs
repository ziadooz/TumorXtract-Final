using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TumorXtract.APIs.DTOs;
using TumorXtract.APIs.Errors;
using TumorXtract.APIs.Helpers;
using TumorXtract.APIs.Service;
using TumorXtract.Core;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Entites.Identity;
using TumorXtract.Core.Repositories;
using TumorXtract.Core.Specifications;
using TumorXtract.Repository.Data;

namespace TumorXtract.APIs.Controllers
{
    [Authorize(Roles = "Doctor,Assistant")]
    public class PatientsController : APIBaseController
    {
        //private readonly IGenericRepository<Patient> _patientRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;
        private readonly IAnalysisService _analysisService;
        private readonly ApplicationDbContext _context;

        public PatientsController(IUnitOfWork unitOfWork , IMapper mapper , UserManager<AppUser> userManager , IAnalysisService analysisService , ApplicationDbContext context )
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            _analysisService = analysisService;
            _context = context;
        }

        #region GetDoctorIdForOperationAndCheckPermission
        private async Task<(string? doctorId, bool canProceed, ActionResult? errorResult)> GetDoctorIdForOperationAndCheckPermission(string permissionType = "")
        {
            var currentUserEmail = User.FindFirstValue(ClaimTypes.Email);
            var appUser = await _userManager.FindByEmailAsync(currentUserEmail);

            if (appUser == null)
            {
                return (null, false, Unauthorized(new ApiResponse(401, "User not found.")));
            }
            string doctorIdToQuery;
            bool hasPermission = false;

            if (await _userManager.IsInRoleAsync(appUser, "Doctor"))
            {
                doctorIdToQuery = appUser.Id;
                hasPermission = true;
            }
            else if (await _userManager.IsInRoleAsync(appUser, "Assistant"))
            {
                var assistant = await _context.Assistants.FindAsync(appUser.Id);
                if (assistant == null)
                    return (null, false, Unauthorized(new ApiResponse(401, "Assistant profile not found.")));

                doctorIdToQuery = assistant.DoctorId;
                switch (permissionType.ToLower())
                {
                    case "read": hasPermission = assistant.CanReadPatients; break;
                    case "create": hasPermission = assistant.CanCreatePatients; break;
                    case "update": hasPermission = assistant.CanUpdatePatients; break;
                    case "delete": hasPermission = assistant.CanDeletePatients; break;
                    case "linkanalysis": hasPermission = assistant.CanUpdatePatients; break;
                    default: hasPermission = false; break;
                }

                if (!hasPermission)
                    return (null, false, Forbid()); 
            }
            else
            {
                return (null, false, Unauthorized(new ApiResponse(401, "User role not supported for this operation.")));
            }

            return (doctorIdToQuery, true, null); 
        }
        #endregion
       

        // Get All
        [HttpGet] // BaseUrl/api/Patients
        public async Task<ActionResult<Pagination<PatientDto>>> GetPatients([FromQuery] PatientSpaceParams Params)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("read");
            if (!canProceed)
            {
                return errorResult!;
            }
            Params.DoctorId = doctorId;
            var spec = new PatientWithAddressAndAnalysisSpecifications(Params);
            var countSpec = new PatientWithFilttrationForCountAsync(Params);
            var totalItems = await _unitOfWork.Repository<Patient>().GetCountdWithSpecAsync(countSpec);
            var patients = await _unitOfWork.Repository<Patient>().GetAllWithSpecAsync(spec);
            var mappedPatients = _mapper.Map<IReadOnlyList<Patient>, IReadOnlyList<PatientDto>>(patients);
            return Ok(new Pagination<PatientDto>(Params.PageIndex, Params.PageSize, totalItems, mappedPatients));
        }

        //// Get All Bt Id
        [HttpGet("{id}")] // BaseUrl/api/Patients/{id}
        [ProducesResponseType(typeof(PatientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PatientDto>> GetPatient(int id)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("read");
            if (!canProceed) return errorResult!;
            var spec = new PatientWithAddressAndAnalysisSpecifications(id, doctorId);
            var patient = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(spec);

            if (patient == null)
                return NotFound(new ApiResponse(404, "Patient not found or not associated with your scope."));

            var mappedPatient = _mapper.Map<Patient, PatientDto>(patient);
            return Ok(mappedPatient);
        }

        //// Create Patient
        [HttpPost("CreatePatient")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(PatientDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(ApiValidationErrorResponse))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<PatientDto>> CreatePatient([FromBody] CreatePatientDto createPatientDto)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("create");
            if (!canProceed) return errorResult!;
            var patient = _mapper.Map<Patient>(createPatientDto);
            patient.DoctorId = doctorId; 
            var result = await _unitOfWork.Repository<Patient>().AddAsync(patient); 
            if (result <= 0)
                return BadRequest(new ApiResponse(400, "Failed to create patient."));
            var spec = new PatientWithAddressAndAnalysisSpecifications(patient.Id, doctorId);
            var createdPatientWithDetails = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(spec);
            var patientDto = _mapper.Map<PatientDto>(createdPatientWithDetails);
            return CreatedAtAction(nameof(GetPatient), new { id = patient.Id }, patientDto);
        }

        //// Update Patient
        [HttpPut("UpdatePatient/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PatientDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(ApiValidationErrorResponse))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PatientDto>> UpdatePatient(int id, [FromBody] UpdatePatientDto updatePatientDto)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("update");
            if (!canProceed) return errorResult!;

            var spec = new PatientWithAddressAndAnalysisSpecifications(id, doctorId);
            var patient = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(spec);

            if (patient == null)
                return NotFound(new ApiResponse(404, "Patient not found or not associated with your scope."));

            _mapper.Map(updatePatientDto, patient);
            if (updatePatientDto.Address != null && patient.Address != null)
            {
                _mapper.Map(updatePatientDto.Address, patient.Address);
            }
            else if (updatePatientDto.Address != null && patient.Address == null) 
            {
                patient.Address = _mapper.Map<Address>(updatePatientDto.Address);
            }

            if (updatePatientDto.Analysis != null && patient.Analysis != null)
            {
            }
            var result = await _unitOfWork.Repository<Patient>().UpdateAsync(patient);
            if (result <= 0)
                return BadRequest(new ApiResponse(400, "Failed to update patient or no changes were made."));
            var updatedSpec = new PatientWithAddressAndAnalysisSpecifications(patient.Id, doctorId);
            var updatedPatientWithDetails = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(updatedSpec);
            var patientDto = _mapper.Map<PatientDto>(updatedPatientWithDetails);
            return Ok(patientDto);
        }

        //// Delete
        //[Authorize]
        [HttpDelete("DeletePatient/{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeletePatient(int id)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("delete");
            if (!canProceed) return errorResult!;
            var spec = new PatientWithAddressAndAnalysisSpecifications(id, doctorId);
            var patient = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(spec);
            if (patient == null)
                return NotFound(new ApiResponse(404, "Patient not found or not associated with your scope."));
            var result = await _unitOfWork.Repository<Patient>().DeleteAsync(patient);
            if (result <= 0)
                return BadRequest(new ApiResponse(400, "Failed to delete patient."));
            return NoContent();
        }

        // link-analysis
        [HttpPost("{patientId:int}/link-analysis")]
        [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AnalysisDto>> LinkAnalysis(int patientId, [FromBody] LinkAnalysisRequestDto request)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("linkanalysis");
            if (!canProceed) return errorResult!;
            var patientSpec = new PatientWithAddressAndAnalysisSpecifications(patientId, doctorId);
            var patient = await _unitOfWork.Repository<Patient>().GetByIdWithSpecAsync(patientSpec);
            if (patient == null)
            {
                return NotFound(new ApiResponse(404, $"Patient with ID {patientId} not found or not associated with your scope."));
            }
            var linkedAnalysis = await _analysisService.LinkAnalysisToPatientAsync(patientId, request.TemporaryAnalysisId, doctorId);

            if (linkedAnalysis == null)
            {
                return BadRequest(new ApiResponse(400, "Failed to link analysis to patient. Patient or temporary analysis may not exist, or you may not have permission."));
            }
            return Ok(linkedAnalysis);
        }

        //CreatePatientWithAnalysis
        [HttpPost("CreatePatientWithAnalysis")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(PatientDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(ApiValidationErrorResponse))]
        public async Task<ActionResult<PatientDto>> CreatePatientWithAnalysis([FromBody] CreatePatientWithAnalysisDto createDto)
        {
            var (doctorId, canProceed, errorResult) = await GetDoctorIdForOperationAndCheckPermission("create");
            if (!canProceed) return errorResult!;
            var createdPatientDto = await _analysisService.CreatePatientWithAnalysisAsync(createDto, doctorId);
            if (createdPatientDto == null)
            {
                return BadRequest(new ApiResponse(400, "Failed to create patient with analysis."));
            }
            return CreatedAtAction(nameof(GetPatient), new { id = createdPatientDto.Id }, createdPatientDto);
        }

    }
}
