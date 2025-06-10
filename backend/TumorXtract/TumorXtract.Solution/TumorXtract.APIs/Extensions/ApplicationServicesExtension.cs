using Microsoft.AspNetCore.Mvc;
using TumorXtract.APIs.Errors;
using TumorXtract.APIs.Helpers;
using TumorXtract.Core;
using TumorXtract.Core.Repositories;
using TumorXtract.Repository;

namespace TumorXtract.APIs.Extensions
{
    public static class ApplicationServicesExtension
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection Services)
        {
            Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            Services.AddScoped<ITemporaryAnalysisRepository, TemporaryAnalysisRepository>();
            Services.AddAutoMapper(typeof(MappingProfiles));

            Services.AddScoped<IUnitOfWork,UnitOfWork>();

            #region Error Handling
            Services.Configure<ApiBehaviorOptions>(Options =>
            {
                Options.InvalidModelStateResponseFactory = (actionContext) =>
                {
                    var errors = actionContext.ModelState.Where(P => P.Value.Errors.Count() > 0)
                                                         .SelectMany(P => P.Value.Errors)
                                                         .Select(E => E.ErrorMessage)
                                                         .ToArray();
                    var ValidationErrorResponse = new ApiValidationErrorResponse()
                    {
                        Errors = errors
                    };
                    return new BadRequestObjectResult(ValidationErrorResponse);
                };
            });
            #endregion

            return Services;
        }
    }
}
