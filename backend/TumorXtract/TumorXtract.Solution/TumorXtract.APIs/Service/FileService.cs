using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;
using TumorXtract.APIs.Service;
using TumorXtract.Core.Services; 

namespace TumorXtract.Service 
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;

        public FileService(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<string?> SaveImageAsync(IFormFile imageFile, string subfolderName)
        {
            if (imageFile == null || imageFile.Length == 0) return null;

            var targetFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images", subfolderName);
            if (!Directory.Exists(targetFolder)) Directory.CreateDirectory(targetFolder);

            var fileExtension = Path.GetExtension(imageFile.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(targetFolder, uniqueFileName);

            try
            {
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(stream);
                }
                return Path.Combine("images", subfolderName, uniqueFileName).Replace('\\', '/');
            }
            catch (Exception ex) {  return null; }
        }

        public async Task<string?> SaveImageFromBytesAsync(byte[] imageBytes, string originalFileName, string subfolderName)
        {
            if (imageBytes == null || imageBytes.Length == 0) return null;

            var targetFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images", subfolderName);
            if (!Directory.Exists(targetFolder)) Directory.CreateDirectory(targetFolder);

            var fileExtension = Path.GetExtension(originalFileName);
            if (string.IsNullOrEmpty(fileExtension)) fileExtension = ".png"; 
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(targetFolder, uniqueFileName);

            try
            {
                await File.WriteAllBytesAsync(filePath, imageBytes);
                return Path.Combine("images", subfolderName, uniqueFileName).Replace('\\', '/');
            }
            catch (Exception ex) { /* Log ex */ return null; }
        }

        public void DeleteImage(string? relativeImagePath)
        {
            if (string.IsNullOrEmpty(relativeImagePath)) return;
            var fullPath = Path.Combine(_webHostEnvironment.WebRootPath, relativeImagePath.TrimStart('/', '\\'));
            try
            {
                if (File.Exists(fullPath)) File.Delete(fullPath);
            }
            catch (Exception ex) { /* Log ex */ }
        }
    }
}
