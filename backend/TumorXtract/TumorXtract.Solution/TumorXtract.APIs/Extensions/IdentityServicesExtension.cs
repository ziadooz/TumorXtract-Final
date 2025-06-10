using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TumorXtract.Core.Entites.Identity;
using TumorXtract.Core.Services;
using TumorXtract.Repository.Data;
using TumorXtract.Servicesb;

namespace TumorXtract.APIs.Extensions
{
    public static class IdentityServicesExtension
    {
        public static IServiceCollection AddAIdentityServices(this IServiceCollection Services , IConfiguration configuration)
        {
            Services.AddScoped<ITokenService , TokenService>();
            Services.AddIdentity<AppUser, IdentityRole>()
                            .AddEntityFrameworkStores<ApplicationDbContext>();

            Services.AddAuthentication(Options =>
            {
                Options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                Options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

            })
                    .AddJwtBearer( Options =>
                    {
                        Options.TokenValidationParameters = new TokenValidationParameters()
                        {
                            ValidateIssuer = true ,
                            ValidIssuer = configuration["JWT:VaildIssuer"],
                            ValidateAudience = true ,
                            ValidAudience = configuration["JWT:VaildAudience"],
                            ValidateLifetime = true ,
                            ValidateIssuerSigningKey = true ,
                            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:Key"]))
                        };
                    }); // UserManager | SignInManager | RoleManager


            return Services;
        }
    }
}
