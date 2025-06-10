using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;

namespace TumorXtract.Core.Repositories
{
    public interface ITemporaryAnalysisRepository
    {
        Task AddAsync(TemporaryAnalysis entity);
        Task<TemporaryAnalysis?> GetByIdAsync(Guid id);
        void Delete(TemporaryAnalysis entity);
    }
}
