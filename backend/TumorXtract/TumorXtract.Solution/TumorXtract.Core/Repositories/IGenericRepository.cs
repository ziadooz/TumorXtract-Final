using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TumorXtract.Core.Entites;
using TumorXtract.Core.Specifications;

namespace TumorXtract.Core.Repositories
{
    public interface IGenericRepository<T> where T : BaseEntity
    {
        #region WithOut Specifications
        // Get All
        Task<IReadOnlyList<T>> GetAllAsync();
        // Get by Id
        Task<T> GetByIdAsync(int id);
        #endregion

        #region With Specifications

        Task<IReadOnlyList<T>> GetAllWithSpecAsync(ISpecifications<T> Spec);

        Task<T> GetByIdWithSpecAsync(ISpecifications<T> Spec);

        Task<int> GetCountdWithSpecAsync(ISpecifications<T> Spec);

        #endregion

        Task<int> AddAsync(T entity);
        Task<int> UpdateAsync(T entity); // Changed to async to save changes
        Task<int> DeleteAsync(T entity);
    }
}
