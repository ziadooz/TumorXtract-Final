using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class UpdateAssistantDto
    {
        [StringLength(100, MinimumLength = 2)]
        public string? DisplayName { get; set; }

        [StringLength(200)]
        public string? AddressClinic { get; set; }
        public bool? CanReadPatients { get; set; }
        public bool? CanCreatePatients { get; set; }
        public bool? CanUpdatePatients { get; set; }
        public bool? CanDeletePatients { get; set; }
    }
}
