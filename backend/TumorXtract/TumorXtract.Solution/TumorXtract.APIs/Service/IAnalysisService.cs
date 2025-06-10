using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;
using TumorXtract.APIs.DTOs;


namespace TumorXtract.APIs.Service
{
    public interface IAnalysisService
    {
        Task<AnalysisDetectionResponseDto?> PerformDetectionAsync(IFormFile file);
        Task<AnalysisDto?> LinkAnalysisToPatientAsync(int patientId, Guid temporaryAnalysisId, string doctorId); 
        Task<PatientDto?> CreatePatientWithAnalysisAsync(CreatePatientWithAnalysisDto patientDto, string doctorId); 
    }
}
