using System;
using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class LinkAnalysisRequestDto
    {
        [Required]
        public Guid TemporaryAnalysisId { get; set; }
    }
}
