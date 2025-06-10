using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Repositories;

namespace TumorXtract.Core
{
    public interface IUnitOfWork : IAsyncDisposable
    {
        IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity;
        ITemporaryAnalysisRepository TemporaryAnalysisRepository { get; }
        Task<int> CompleteAsync();
    }
}
