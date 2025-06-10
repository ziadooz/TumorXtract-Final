using TumorXtract.Core.Entites;

namespace TumorXtract.APIs.DTOs
{
    public class AddressDto
    {
        public int Id {  get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string? State { get; set; }
        public string Country { get; set; }
    }
}
