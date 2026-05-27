import { useAdminListings } from '../hooks/useAdminListings';

export const AdminListingsPage = () => {
  const { data: lists, isLoading, deleteListing } = useAdminListings();

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Listings</h1>
        {/* Button to open create listing modal */}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {lists?.map((l: any) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{l.title}</td>
                <td className="px-4 py-3">{l.price}₮</td>
                <td className="px-4 py-3">{l.size}</td>
                <td className="px-4 py-3 capitalize">{l.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteListing(l.id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!lists?.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
