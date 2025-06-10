using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class AssistantBaseDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string DisplayName { get; set; } // FullName

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [StringLength(200)]
        public string AddressClinic { get; set; }
        public bool CanReadPatients { get; set; }
        public bool CanCreatePatients { get; set; }
        public bool CanUpdatePatients { get; set; }
        public bool CanDeletePatients { get; set; }
    }
}

