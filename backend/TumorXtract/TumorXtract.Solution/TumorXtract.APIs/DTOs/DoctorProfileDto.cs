namespace TumorXtract.APIs.DTOs
{
    public class DoctorProfileDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string DisplayName { get; set; }
        public string Specialization { get; set; }
        public string PhoneNumber { get; set; }
        public string? ImageUrl { get; set; }
    }
}
