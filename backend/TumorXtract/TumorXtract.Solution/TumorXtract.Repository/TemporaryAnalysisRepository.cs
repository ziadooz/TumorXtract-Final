using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Repositories;
using TumorXtract.Repository.Data;

namespace TumorXtract.Repository
{
    public class TemporaryAnalysisRepository : ITemporaryAnalysisRepository
    {
        private readonly ApplicationDbContext _dbContext;
        public TemporaryAnalysisRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task AddAsync(TemporaryAnalysis entity) => await _dbContext.TemporaryAnalyses.AddAsync(entity);
        public async Task<TemporaryAnalysis?> GetByIdAsync(Guid id) => await _dbContext.TemporaryAnalyses.FindAsync(id);
        public void Delete(TemporaryAnalysis entity) => _dbContext.TemporaryAnalyses.Remove(entity);
    }
}
