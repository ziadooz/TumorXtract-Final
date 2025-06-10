using AutoMapper;
using TumorXtract.APIs.DTOs;
using TumorXtract.Core.Entites;
namespace TumorXtract.APIs.Helpers
{
    public class AnalysisMriScanPictureUrlResolve : IValueResolver<Analysis, AnalysisDto, string>
    {
        private readonly IConfiguration _configuration;
        public AnalysisMriScanPictureUrlResolve(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public string Resolve(Analysis source, AnalysisDto destination, string destMember, ResolutionContext context)
        {
            if (!string.IsNullOrEmpty(source.OriginalMriImagePath))
                return $"{_configuration["ApiBaseUrl"]}{source.OriginalMriImagePath}";
            return string.Empty;
        }
    }

    //private readonly IConfiguration _config;

    //public AnalysisPictureUrlResolve(IConfiguration config)
    //{
    //    _config = config;
    //}

    //public string Resolve(Analysis source, AnalysisDto destination, string destMember, ResolutionContext context)
    //{
    //    if (!string.IsNullOrEmpty(source.MRIScane))
    //    {
    //        return source.MRIScane;
    //    }
    //    return _config["AppSettings:DefaultAnalysisPicture"];
    //}  
}
