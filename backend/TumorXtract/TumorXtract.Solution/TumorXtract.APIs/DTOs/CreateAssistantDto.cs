using System.ComponentModel.DataAnnotations;

namespace TumorXtract.APIs.DTOs
{
    public class CreateAssistantDto : AssistantBaseDto
    {
        [Required]
        [RegularExpression("(?=^.{6,20}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+.,;:<>?/{}\\[\\]\\-=~`]).*$",
            ErrorMessage = "Password must be 6-20 characters and include an uppercase letter, a lowercase letter, a digit, and a special character.")]
        public string Password { get; set; }
    }
}
