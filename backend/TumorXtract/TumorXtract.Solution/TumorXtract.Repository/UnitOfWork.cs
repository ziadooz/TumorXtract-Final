using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Repositories;
using TumorXtract.Repository.Data;

namespace TumorXtract.Repository
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _dbContext;
        private Hashtable _repositories;
        private ITemporaryAnalysisRepository _temporaryAnalysisRepository;
        public UnitOfWork(ApplicationDbContext dbContext) 
        {
            _dbContext = dbContext;
            _repositories = new Hashtable();
        }

        public ITemporaryAnalysisRepository TemporaryAnalysisRepository =>
        _temporaryAnalysisRepository ??= new TemporaryAnalysisRepository(_dbContext);

        public async Task<int> CompleteAsync()
        => await _dbContext.SaveChangesAsync();
        
        // Close Connection With Database
        public async ValueTask DisposeAsync()
        => await _dbContext.DisposeAsync();

        public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity
        {
            var type = typeof(TEntity).Name; // Models
            if (!_repositories.ContainsKey(type))
            {
                var Repository = new GenericRepository<TEntity>(_dbContext);
                _repositories.Add(type, Repository);
            }
            return _repositories[type] as IGenericRepository<TEntity>;
        }
    }
}
