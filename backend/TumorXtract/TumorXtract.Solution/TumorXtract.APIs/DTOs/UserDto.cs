namespace TumorXtract.APIs.DTOs
{
    public class UserDto
    {
        public string UserId { get; set; }
        public string DisplayName { get; set; }
        //public string Specialization { get; set; }
        public string Email { get; set; }
        public string Token { get; set; }
        public IList<string> Roles { get; set; } // ADDED
    }
}
