using AutoMapper;
using TumorXtract.APIs.DTOs;
using TumorXtract.Core.Entites.Identity;

namespace TumorXtract.APIs.Helpers
{
    public class DoctorImagePictureUrlResolver : IValueResolver<Doctor, DoctorProfileDto, string?>
    {
        private readonly IConfiguration _configuration;
        public DoctorImagePictureUrlResolver(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public string? Resolve(Doctor source, DoctorProfileDto destination, string? destMember, ResolutionContext context)
        {
            if (!string.IsNullOrEmpty(source.ImageUrl))
                return $"{_configuration["ApiBaseUrl"]}{source.ImageUrl}";
            return string.Empty;
        }
    }
}
