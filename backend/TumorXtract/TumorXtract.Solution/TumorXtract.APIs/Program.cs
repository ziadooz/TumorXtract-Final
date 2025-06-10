using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TumorXtract.APIs.Errors;
using TumorXtract.APIs.Extensions;
using TumorXtract.APIs.Helpers;
using TumorXtract.APIs.MiddleWares;
using TumorXtract.APIs.Service;
using TumorXtract.Core.Entites.Identity;
using TumorXtract.Core.Repositories;
using TumorXtract.Core.Services;
using TumorXtract.Repository;
using TumorXtract.Repository.Data;
using TumorXtract.Service;

namespace TumorXtract.APIs
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            #region Configer services : Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Database
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
             options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Extension
            builder.Services.AddApplicationServices();
            builder.Services.AddAIdentityServices(builder.Configuration);

            //builder.Services.AddAIdentityServices(builder.Configuration);
            builder.Services.AddScoped<IAnalysisService, AnalysisService>();
           // builder.Services.AddHttpClient();
            builder.Services.AddHttpClient("FlaskAIService", client =>
            {
                var flaskUrl = builder.Configuration["FlaskAIService:PredictUrl"];
            });

            builder.Services.AddScoped<IFileService, FileService>();

            // *** Add CORS services START ***
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowMyFrontendPolicy",
                    policy =>
                    {
                        policy.WithOrigins(
                                  "http://127.0.0.1:5500", // For VS Code Live Server
                                  "http://localhost:5500",  // Common alternative for Live Server
                                  "http://localhost:8000" ,
                                  "http://localhost:5000/predict"
                              // For your Python server
                              )
                              .AllowAnyHeader()
                              .AllowAnyMethod();
                    });
            });

            #endregion

            var app = builder.Build();

            #region Update-Database
            // --- Update-Database & Seed ---
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var loggerFactory = services.GetRequiredService<ILoggerFactory>();
            try
            {
                var dbContext = services.GetRequiredService<ApplicationDbContext>();
                var userManager = services.GetRequiredService<UserManager<AppUser>>(); 
                var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>(); 
                var logger = loggerFactory.CreateLogger<Program>();

                logger.LogInformation("Applying database migrations...");
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Migrations applied successfully.");

                logger.LogInformation("Seeding roles...");
                await ApplicationDbContextSeed.SeedRolesAsync(roleManager); 
                logger.LogInformation("Roles seeded.");

                logger.LogInformation("Seeding initial doctor user...");
                await ApplicationDbContextSeed.SeedUserAsync(userManager, roleManager); 
                logger.LogInformation("Doctor user seeded.");
                var seededAppUser = await userManager.FindByEmailAsync("e0m1a0n1@gmail.com");
                string? doctorId = seededAppUser?.Id;

                if (doctorId != null)
                {
                    logger.LogInformation($"Seeding patient data for Doctor ID: {doctorId}...");
                    await DbContextSeed.SeedPatientsAsync(dbContext, doctorId);
                    logger.LogInformation("Patient data seeded.");
                }
                else
                {
                    logger.LogError("Could not find the seeded doctor user to assign patients.");
                }
            }
            catch (Exception ex)
            {
                var logger = loggerFactory.CreateLogger<Program>();
                logger.LogError(ex, "An error occurred during database migration or seeding.");
            }
            #endregion

            #region Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseMiddleware<ExceptionMiddleWare>();
                app.UseSwaggerMiddleWares();
            }
            app.UseStatusCodePagesWithReExecute("/errors/{0}");
            app.UseStaticFiles();
            app.UseHttpsRedirection();
            app.UseCors("AllowMyFrontendPolicy");
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers(); 
            #endregion
            
            app.Run();
        }        
    }
}
