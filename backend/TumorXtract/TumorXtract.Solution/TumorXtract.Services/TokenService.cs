using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites.Identity;
using TumorXtract.Core.Services;

namespace TumorXtract.Servicesb
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration configuration;

        public TokenService(IConfiguration configuration)
        {
            this.configuration = configuration;
        }
        public async Task<string> CreateTokenAsync(AppUser User, UserManager<AppUser> userManager)
        {
            // 1. Private Claims --> same prop fpr user
            var AuthClaims = new List<Claim>()
            {
                new Claim(ClaimTypes.GivenName, User.DisplayName),
                new Claim(ClaimTypes.Email, User.Email),
                new Claim(ClaimTypes.NameIdentifier, User.Id)
            };

            var UserRoles = await userManager.GetRolesAsync(User);
            foreach (var Role in UserRoles)
            {
                AuthClaims.Add(new Claim(ClaimTypes.Role, Role));
            }
            // To Convert String To Bytes
            var AuthKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:Key"]));
            var Token = new JwtSecurityToken
                (
                issuer: configuration["JWT:VaildIssuer"],
                audience: configuration["JWT:VaildAudience"],
                expires: DateTime.Now.AddDays(double.Parse(configuration["JWT:DurationInDays"])),
                claims : AuthClaims,
                signingCredentials : new SigningCredentials(AuthKey , SecurityAlgorithms.HmacSha384Signature)
                );
            return new JwtSecurityTokenHandler().WriteToken(Token);
        }
    }
}
