using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Repositories;
using TumorXtract.Core.Specifications;
using TumorXtract.Repository.Data;

namespace TumorXtract.Repository
{
    public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
    {
        private readonly ApplicationDbContext _dbContext;

        // Ask CLR For Creating Object From DbContext
        public GenericRepository(ApplicationDbContext dbContext) 
        {
            _dbContext = dbContext;
        }
        #region WithOut Spec

        public async Task<IReadOnlyList<T>> GetAllAsync()
        {
            if (typeof(T) == typeof(Patient))
            {
                return (IReadOnlyList<T>)await _dbContext.Patients.Include(P => P.Address).Include(P => P.Analysis).ToListAsync();
            }
            return await _dbContext.Set<T>().ToListAsync();
        }

        public async Task<T> GetByIdAsync(int id)
        {
            return await _dbContext.Set<T>().FindAsync(id);
        } 
        #endregion

        private IQueryable<T> ApllySpecifications(ISpecifications<T> Spec)
        {
            return SpecificationsEvalutor<T>.GetQuery(_dbContext.Set<T>(), Spec);
        }

        // Get All
        public async Task<IReadOnlyList<T>> GetAllWithSpecAsync(ISpecifications<T> Spec)
        {
            return await ApllySpecifications(Spec).ToListAsync();
        }

        // Get By Id
        public async Task<T> GetByIdWithSpecAsync(ISpecifications<T> Spec)
        {
            return await ApllySpecifications(Spec).FirstOrDefaultAsync();
        }

        // Create 
        public async Task<int> AddAsync(T entity)
        {
            await _dbContext.Set<T>().AddAsync(entity);
            return await _dbContext.SaveChangesAsync(); // Save changes here
        }

        // Update
        public Task<int> UpdateAsync(T entity) // Note: Simple Update signature
        {
            // Attach is only needed if the entity is NOT already tracked.
            // If fetched with tracking (default), just setting state is enough.
            _dbContext.Entry(entity).State = EntityState.Modified;
            return _dbContext.SaveChangesAsync(); // Save changes here
        }

        // Delete
        public Task<int> DeleteAsync(T entity) // Note: Simple Delete signature
        {
            _dbContext.Set<T>().Remove(entity);
            return _dbContext.SaveChangesAsync(); // Save changes here
        }

        public async Task<int> GetCountdWithSpecAsync(ISpecifications<T> Spec)
        {
            return await ApllySpecifications(Spec).CountAsync();
        }
    }
}
