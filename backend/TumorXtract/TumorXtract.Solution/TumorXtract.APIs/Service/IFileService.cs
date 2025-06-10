using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TumorXtract.APIs.Service
{
    public interface IFileService
    {
        Task<string?> SaveImageAsync(IFormFile imageFile, string subfolderName);
        Task<string?> SaveImageFromBytesAsync(byte[] imageBytes, string originalFileName, string subfolderName);
        void DeleteImage(string? relativeImagePath);
    }
}
