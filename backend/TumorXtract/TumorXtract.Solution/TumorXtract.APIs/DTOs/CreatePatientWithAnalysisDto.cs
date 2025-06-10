using System;
using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class CreatePatientWithAnalysisDto
    {
        [Required]
        public CreatePatientDto PatientData { get; set; } 

        [Required]
        public Guid TemporaryAnalysisId { get; set; }
    }
}
