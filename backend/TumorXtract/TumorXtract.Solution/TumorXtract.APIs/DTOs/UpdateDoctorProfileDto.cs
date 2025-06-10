using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class UpdateDoctorProfileDto
    {
        public string DisplayName { get; set; }
        public string Specialization { get; set; }
        [Phone]
        public string PhoneNumber { get; set; }
        public string? ImageUrl { get; set; }
    }
}
