using AutoMapper;
using TumorXtract.APIs.DTOs;
using TumorXtract.Core.Entites;
namespace TumorXtract.APIs.Helpers
{
    public class AnalysisMaskPictureUrlResolver : IValueResolver<Analysis, AnalysisDto, string>
    {
        private readonly IConfiguration _configuration;
        public AnalysisMaskPictureUrlResolver(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public string Resolve(Analysis source, AnalysisDto destination, string destMember, ResolutionContext context)
        {
            if (!string.IsNullOrEmpty(source.MaskImagePath))
                return $"{_configuration["ApiBaseUrl"]}{source.MaskImagePath}";
            return string.Empty;
        }   
    }
}
