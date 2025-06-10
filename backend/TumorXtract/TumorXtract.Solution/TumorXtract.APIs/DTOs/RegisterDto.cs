using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string DisplayName { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        [Phone]
        public string PhoneNumber { get; set; }
        [Required]
        [RegularExpression("(?=^.{6,10}$)(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&amp;*()_+]).*$",
            ErrorMessage ="Password must contains 1 Uppercase , 1 Lowercase , 1 Digit , 1 Spaecial Charactor")]
        public string Password { get; set; }
        [Required]
        public string Specialization { get; set; }
        //[Required]
        //public string UserName { get; set; }

    }
}
