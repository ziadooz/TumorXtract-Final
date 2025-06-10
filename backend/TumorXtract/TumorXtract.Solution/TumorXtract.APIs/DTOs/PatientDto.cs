namespace TumorXtract.APIs.DTOs
{
    public class PatientDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public DateTime? LastVist { get; set; }
        public string Gender { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string? PrimarySymptoms { get; set; }
        public string? MedicalHistory { get; set; }
        public AddressDto Address { get; set; }
        public AnalysisDto? Analysis { get; set; }
    }
}
