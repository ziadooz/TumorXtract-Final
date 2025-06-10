using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } // Or Email

        [Required]
        public string Password { get; set; }
    }
}
