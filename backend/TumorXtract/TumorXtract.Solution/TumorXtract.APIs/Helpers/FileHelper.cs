namespace TumorXtract.APIs.Helpers
{
    public static class FileHelper
    {
        public static async Task<string?> SaveImageAsync(IFormFile imageFile, IWebHostEnvironment env, string subfolderName)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return null;
            }
            var targetFolder = Path.Combine(env.WebRootPath, "images", subfolderName); 
            if (!Directory.Exists(targetFolder))
            {
                Directory.CreateDirectory(targetFolder);
            }
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
            catch (Exception ex)
            {

                return null; 
            }
        }

        public static void DeleteImage(string? relativeImagePath, IWebHostEnvironment env)
        {
            if (string.IsNullOrEmpty(relativeImagePath)) return;

            var fullPath = Path.Combine(env.WebRootPath, relativeImagePath.TrimStart('/', '\\')); 

            try
            {
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {

            }
        }
    }
}
