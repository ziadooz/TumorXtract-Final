using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Repository.Data
{
    public static class DbContextSeed
    {
        public static async Task SeedPatientsAsync(ApplicationDbContext dbContext, string doctorId)
        {
            if (!dbContext.Patients.Any())
            {
                try
                {
                    // Adjust path as needed - might need to configure Copy to Output Directory for the json file
                    var patientDataPath = Path.Combine(AppContext.BaseDirectory, "Data", "DataSeed", "patient.json"); // More robust path finding
                    if (!File.Exists(patientDataPath))
                    {
                        // Log error - path is incorrect
                        Console.WriteLine($"Error: Patient seed file not found at {patientDataPath}"); // Replace with proper logging
                        return;
                    }

                    var patientData = File.ReadAllText(patientDataPath);
                    var patients = JsonSerializer.Deserialize<List<Patient>>(patientData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); // Use options

                    if (patients?.Count > 0)
                    {
                        foreach (var patient in patients)
                        {
                            patient.DoctorId = doctorId; // Assign the correct DoctorId
                                                         // EF Core will automatically add related Address/Analysis if they are part of the patient object
                            await dbContext.Set<Patient>().AddAsync(patient);
                        }
                        await dbContext.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    // Log the exception during seeding
                    Console.WriteLine($"Error seeding patients: {ex.Message}"); // Replace with proper logging
                }
            }
        }
    }
    //public static async Task SeedData(ApplicationDbContext dbContext)
    //{
    //    if (!dbContext.Patients.Any())
    //    {
    //        var PatientData = File.ReadAllText("../TumorXtract.Repository/Data/DataSeed/patient.json"); // convert json to string
    //        var Patients = JsonSerializer.Deserialize<List<Patient>>(PatientData);
    //        if (Patients?.Count > 0)
    //        {
    //            foreach (var patient in Patients)
    //            {
    //                await dbContext.Set<Patient>().AddAsync(patient);
    //            }
    //            await dbContext.SaveChangesAsync();
    //        }
    //    }

    //}
}

