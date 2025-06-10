using AutoMapper;
using TumorXtract.APIs.DTOs;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Entites.Identity;

namespace TumorXtract.APIs.Helpers
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Address, AddressDto>().ReverseMap();

            CreateMap<Analysis, AnalysisDto>()
                .ForMember(d => d.OriginalMriImagePath, o => o.MapFrom<AnalysisMriScanPictureUrlResolve>())
                .ForMember(d => d.MaskImagePath, o => o.MapFrom<AnalysisMaskPictureUrlResolver>())
                .ReverseMap(); 
                                                                                          

            CreateMap<CreateAnalysisDto, Analysis>();

            CreateMap<Patient, PatientDto>(); // For Read 
            //.ForMember(dest => dest.Analysis, opt => opt.MapFrom(src => src.Analysis))
            //.ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address));

            CreateMap<CreatePatientDto, Patient>();// For Create
                //.ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address))
                //.ForMember(dest => dest.Analysis, opt => opt.MapFrom(src => src.Analysis)); 

            CreateMap<UpdatePatientDto, Patient>() // For Update
               .ForAllMembers(opts => opts.Condition((src, dest, srcMember) 
               => srcMember != null));

            // Doctor
            CreateMap<UpdateDoctorProfileDto, Doctor>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Doctor, DoctorProfileDto>()
                .ForMember(d => d.ImageUrl, o => o.MapFrom<DoctorImagePictureUrlResolver>());

            CreateMap<CreatePatientWithAnalysisDto, Patient>();

            // Assistant
            CreateMap<CreateAssistantDto, Assistant>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email)); // Or src.Email.Split('@')[0]
            CreateMap<Assistant, AssistantDto>();
            CreateMap<UpdateAssistantDto, Assistant>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
