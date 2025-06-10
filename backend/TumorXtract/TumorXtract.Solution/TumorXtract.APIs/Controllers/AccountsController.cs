using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.Security.Claims;
using TumorXtract.APIs.DTOs;
using TumorXtract.APIs.Errors;
using TumorXtract.APIs.Helpers;
using TumorXtract.APIs.Service;
using TumorXtract.Core.Entites.Identity;
using TumorXtract.Core.Services;
using TumorXtract.Repository.Data;

namespace TumorXtract.APIs.Controllers
{
    
    public class AccountsController : APIBaseController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;
        private readonly IFileService _fileService;
        private readonly ApplicationDbContext _context;

        public AccountsController(UserManager<AppUser> userManager ,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            IMapper mapper ,
            IWebHostEnvironment env,
            IFileService fileService,
            ApplicationDbContext context
            )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _mapper = mapper;
            _env = env;
            _fileService = fileService;
            _context = context;
        }
        // Register 
        [HttpPost("RegisterDoctor")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto model)
        {
            if(CheckEmailExists(model.Email).Result.Value)
            {
                return BadRequest(new ApiResponse(400 , "Email is Already Exist...Go To Login"));
            }
            var User = new Doctor()
            {
                DisplayName = model.DisplayName,
                Specialization = model.Specialization,
                Email = model.Email,
                UserName = model.Email.Split('@')[0],
                PhoneNumber = model.PhoneNumber,
            };
            var Result = await _userManager.CreateAsync(User, model.Password);
            if (!Result.Succeeded) return BadRequest(new ApiResponse (400));
            await _userManager.AddToRoleAsync(User, "Doctor");

            var ReturnedUser = new UserDto()
            {
                UserId = User.Id,
                DisplayName = User.DisplayName,
                Email = User.Email,
                Token = await _tokenService.CreateTokenAsync(User, _userManager),
                Roles = new[] { "Doctor" }
                //DisplayName = User.DisplayName,
                //Email = User.Email,
                //Token = await _tokenService.CreateTokenAsync(User , _userManager)
            };
            return Ok(ReturnedUser);           
        }

        //Login
        [HttpPost("Login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto model)
        {
            if (!CheckEmailExists(model.Email).Result.Value)
            {
                return BadRequest(new ApiResponse(400, "Email Not Exist...Go To Register"));
            }
            var User = await _userManager.FindByEmailAsync(model.Email);
            if (User is null) return Unauthorized(new ApiResponse(401 , "Invalid Email"));
            var Result = await _signInManager.CheckPasswordSignInAsync(User, model.Password , false); // false => Don't lock account
            if (!Result.Succeeded) return Unauthorized(new ApiResponse(401 , "Incorrect Password"));
            var userRoles = await _userManager.GetRolesAsync(User);
            return Ok(new UserDto
            {
                UserId = User.Id,
                DisplayName = User.DisplayName,
                Email = User.Email,
                Token = await _tokenService.CreateTokenAsync(User, _userManager),
                Roles = userRoles
            });
        }

        //CurrentUser
        [Authorize]
        [HttpGet("GetCurrentUser")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var Email = User.FindFirstValue(ClaimTypes.Email);
            var user = await _userManager.FindByEmailAsync(Email);
            var userRoles = await _userManager.GetRolesAsync(user);
            var ReturnedObject = new UserDto()
            {
                UserId = user.Id,
                DisplayName = user.DisplayName,
                Email = user.Email,
                Token = await _tokenService.CreateTokenAsync(user, _userManager),
                Roles = userRoles
            };
            return Ok(ReturnedObject);
        }

        // Profile Managment
        [Authorize(Roles = "Doctor")]
        [HttpGet("GetProfile")]
        public async Task<ActionResult<DoctorProfileDto>> GetProfile()
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var doctorUser = await _userManager.Users.OfType<Doctor>().SingleOrDefaultAsync(d => d.Email == userEmail); // Fetch as Doctor
            if (doctorUser == null)
            {
                return NotFound(new ApiResponse(404, "Doctor profile not found."));
            }
            var doctorProfile = _mapper.Map<DoctorProfileDto>(doctorUser);
            //var doctorProfile = new DoctorProfileDto
            //{
            //    Id = doctorUser.Id,                      
            //    Email = doctorUser.Email,                  
            //    DisplayName = doctorUser.DisplayName,      
            //    Specialization = doctorUser.Specialization,  
            //    PhoneNumber = doctorUser.PhoneNumber,      
            //    ImageUrl = doctorUser.ImageUrl           
            //};
            return Ok(doctorProfile);
        }

        // updare image 
        [Authorize(Roles = "Doctor")]
        [HttpPost("UploadProfileImage")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(object))] 
        [ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(ApiResponse))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<object>> UploadProfileImage([FromForm] IFormFile profileImage) 
        {
            //if (profileImage == null || profileImage.Length == 0)
            //    return BadRequest(new ApiResponse(400, "No image file provided."));
            //var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            //var extension = Path.GetExtension(profileImage.FileName).ToLowerInvariant();
            //if (!allowedExtensions.Contains(extension))
            //    return BadRequest(new ApiResponse(400, "Invalid image file type."));
            //if (profileImage.Length > 5 * 1024 * 1024) // 5MB limit
            //    return BadRequest(new ApiResponse(400, "File size exceeds 5MB limit."));
            //var relativePath = await _fileService.SaveImageAsync(profileImage, "Doctors"); // Use IFileService
            //if (string.IsNullOrEmpty(relativePath))
            //    return BadRequest(new ApiResponse(500, "Failed to save image."));

            //return Ok(new { imageUrl = relativePath });


            if (profileImage == null || profileImage.Length == 0)
            {
                return BadRequest(new ApiResponse(400, "No image file provided."));
            }
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(profileImage.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse(400, "Invalid image file type. Allowed types: " + string.Join(", ", allowedExtensions)));
            }
            long maxFileSize = 5 * 1024 * 1024;
            if (profileImage.Length > maxFileSize)
            {
                return BadRequest(new ApiResponse(400, $"File size exceeds the limit of {maxFileSize / 1024 / 1024} MB."));
            }
            var relativePath = await FileHelper.SaveImageAsync(profileImage, _env, "Doctors");
            if (string.IsNullOrEmpty(relativePath))
            {
                return BadRequest(new ApiResponse(400, "Failed to save image."));
            }
            return Ok(new { imageUrl = relativePath });
        }


        // Update Profile 
        [Authorize(Roles = "Doctor")]
        [HttpPut("Updateprofile")]
        public async Task<ActionResult<DoctorProfileDto>> UpdateProfile([FromBody] UpdateDoctorProfileDto profileDto)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var user = await _userManager.Users.OfType<Doctor>().SingleOrDefaultAsync(d => d.Email == userEmail); // Fetch as Doctor

            if (user == null)
                return NotFound(new ApiResponse(404, "Doctor profile not found."));

            string? oldImageUrl = user.ImageUrl;

            // Map received DTO to the user entity
            _mapper.Map(profileDto, user); // This maps DisplayName, Specialization, ImageUrl

            // Handle phone number separately if it's part of IdentityUser managed fields
            if (!string.IsNullOrWhiteSpace(profileDto.PhoneNumber) && user.PhoneNumber != profileDto.PhoneNumber)
            {
                var phoneResult = await _userManager.SetPhoneNumberAsync(user, profileDto.PhoneNumber);
                if (!phoneResult.Succeeded)
                {
                    // Handle error, e.g., add to ModelState
                    foreach (var error in phoneResult.Errors) ModelState.AddModelError("PhoneNumber", error.Description);
                    return BadRequest(new ApiValidationErrorResponse { Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }
            }


            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors) ModelState.AddModelError(error.Code, error.Description);
                return BadRequest(new ApiValidationErrorResponse { Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            // Delete old image if a new one was successfully set and is different
            if (!string.IsNullOrEmpty(oldImageUrl) && oldImageUrl != user.ImageUrl && !string.IsNullOrEmpty(user.ImageUrl))
            {
                _fileService.DeleteImage(oldImageUrl); // Use IFileService
            }
            else if (!string.IsNullOrEmpty(oldImageUrl) && string.IsNullOrEmpty(user.ImageUrl)) // Image was removed
            {
                _fileService.DeleteImage(oldImageUrl);
            }
            return Ok(_mapper.Map<DoctorProfileDto>(user));
            //var userEmail = User.FindFirstValue(ClaimTypes.Email); 
            //if (string.IsNullOrEmpty(userEmail))
            //{
            //    return Unauthorized(new ApiResponse(401, "User email claim not found."));
            //}

            //var user = await _userManager.FindByEmailAsync(userEmail); 
            //if (user == null)
            //{
            //    return NotFound(new ApiResponse(404, "Doctor profile not found."));
            //}
            ////------------------------------------------------------------
            //string? oldImageUrl = user.ImageUrl;
            //user.ImageUrl = profileDto.ImageUrl;
            //_mapper.Map(profileDto, user);
            //if (!string.IsNullOrEmpty(oldImageUrl) && oldImageUrl != user.ImageUrl)
            //{
            //    FileHelper.DeleteImage(oldImageUrl, _env);
            //}
            ////------------------------------------------------
            //bool requiresPhoneUpdate = false; 
            //if (!string.IsNullOrWhiteSpace(profileDto.DisplayName))
            //{
            //    user.DisplayName = profileDto.DisplayName;
            //}
            //else
            //{
            //    ModelState.AddModelError(nameof(profileDto.DisplayName), "Display Name cannot be empty.");
            //    return BadRequest(new ApiResponse(400));
            //}
            //user.Specialization = profileDto.Specialization;

            //if (user.PhoneNumber != profileDto.PhoneNumber)
            //{
            //    requiresPhoneUpdate = true;
            //}
            //IdentityResult phoneResult = IdentityResult.Success; 
            //if (requiresPhoneUpdate)
            //{
            //    phoneResult = await _userManager.SetPhoneNumberAsync(user, profileDto.PhoneNumber);
            //    if (!phoneResult.Succeeded)
            //    {
            //        foreach (var error in phoneResult.Errors) { ModelState.AddModelError("PhoneNumber", error.Description); }
            //        return BadRequest(ModelState); 
            //    }
            //}
            //var result = await _userManager.UpdateAsync(user); 
            //if (!result.Succeeded) 
            //{
            //    foreach (var error in result.Errors) { ModelState.AddModelError(error.Code, error.Description); }
            //    return BadRequest(ModelState);
            //}
            //var updatedProfileResponse = _mapper.Map<DoctorProfileDto>(user);
            //if (!string.IsNullOrEmpty(oldImageUrl) && oldImageUrl != user.ImageUrl)
            //{
            //    FileHelper.DeleteImage(oldImageUrl, _env); 
            //}
            //return Ok(updatedProfileResponse);

        }



        // EmailExists
        [HttpGet("EmailExists")]
        public async Task<ActionResult<bool>> CheckEmailExists(string Email)
        {
            return await _userManager.FindByEmailAsync(Email) is not null;
        }
    }
}
