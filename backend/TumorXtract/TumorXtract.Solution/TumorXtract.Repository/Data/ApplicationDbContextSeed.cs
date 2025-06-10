using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites.Identity;

namespace TumorXtract.Repository.Data
{
    public class ApplicationDbContextSeed
    {
        public static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager) 
        {
            if (!await roleManager.RoleExistsAsync("Doctor"))
            {
                await roleManager.CreateAsync(new IdentityRole("Doctor"));
            }
            if (!await roleManager.RoleExistsAsync("Assistant"))
            {
                await roleManager.CreateAsync(new IdentityRole("Assistant"));
            }
        }
        public static async Task SeedUserAsync(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            if (!userManager.Users.OfType<Doctor>().Any(u => u.Email == "e0m1a0n1@gmail.com"))
            {
                var user = new Doctor() 
                {
                    DisplayName = "Eman Essam",
                    Specialization = "Radiologists",
                    Email = "e0m1a0n1@gmail.com",
                    UserName = "eman_essam", 
                    PhoneNumber = "01062298472"
                };
                var result = await userManager.CreateAsync(user, "Pass@w0rd");
                if (result.Succeeded)
                {
                    if (!await roleManager.RoleExistsAsync("Doctor"))
                    {
                        await roleManager.CreateAsync(new IdentityRole("Doctor"));
                    }
                    await userManager.AddToRoleAsync(user, "Doctor");
                }
            }
        }

    }
}