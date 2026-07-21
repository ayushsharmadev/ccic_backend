"use client";

import { useCallback, useEffect, useState } from "react";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showError, showSuccess } from "@/components/utils/ApnaNotify";

const EMPTY_FORM = {
  name: "",
  code: "",
  symbol: "",
  status: "active",
  displayOrder: "0",
};

function authHeaders(json = false) {
  const token = localStorage.getItem("token");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CurrencyMasterPage() {
  const [currencies, setCurrencies] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formModal, setFormModal] = useState({ open: false, mode: "add", id: null });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCurrencies = useCallback(async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "8" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const response = await fetch(`/api/currencies?${params}`, { headers: authHeaders() });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch currencies");
      setCurrencies(
        result.data.map((item) => ({
          id: item._id,
          name: item.name,
          code: item.code,
          symbol: item.symbol,
          status: item.status,
          displayOrder: item.displayOrder ?? 0,
        }))
      );
      setCurrentPage(page);
      setTotalPages(result.pagination?.pages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (error) {
      showError(error.message || "Failed to fetch currencies");
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies(1, debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter, fetchCurrencies]);

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setFormModal({ open: true, mode: "add", id: null });
  };

  const openEdit = (item) => {
    setFormData({
      name: item.name,
      code: item.code,
      symbol: item.symbol,
      status: item.status,
      displayOrder: String(item.displayOrder),
    });
    setFormModal({ open: true, mode: "edit", id: item.id });
  };

  const closeForm = () => {
    if (saving) return;
    setFormModal({ open: false, mode: "add", id: null });
    setFormData(EMPTY_FORM);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "code" ? value.toUpperCase().slice(0, 3) : value,
    }));
  };

  const saveCurrency = async () => {
    if (!formData.name.trim() || !/^[A-Z]{3}$/.test(formData.code) || !formData.symbol.trim()) {
      showError("Name, 3-letter ISO code, and symbol are required");
      return;
    }

    try {
      setSaving(true);
      const isEdit = formModal.mode === "edit";
      const response = await fetch(isEdit ? `/api/currencies/${formModal.id}` : "/api/currencies", {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          code: formData.code.trim(),
          symbol: formData.symbol.trim(),
          displayOrder: Number(formData.displayOrder),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to save currency");
      showSuccess(isEdit ? "Currency updated successfully!" : "Currency added successfully!");
      setFormModal({ open: false, mode: "add", id: null });
      setFormData(EMPTY_FORM);
      await fetchCurrencies(currentPage, debouncedSearch, statusFilter);
    } catch (error) {
      showError(error.message || "Failed to save currency");
    } finally {
      setSaving(false);
    }
  };

  const deleteCurrency = async () => {
    try {
      const response = await fetch(`/api/currencies/${deleteModal.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to delete currency");
      showSuccess("Currency deleted successfully!");
      setDeleteModal({ open: false, id: null, name: "" });
      await fetchCurrencies(currentPage, debouncedSearch, statusFilter);
    } catch (error) {
      showError(error.message || "Failed to delete currency");
    }
  };

  const handleSelectAll = (pageIds, allSelected) => {
    setSelectedItems((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])]
    );
  };

  const columns = [
    {
      key: "code",
      header: "ISO Code",
      headerClassName: "text-left",
      cellClassName: "text-left",
      render: (item) => <span className="font-semibold tracking-wide text-gray-900 dark:text-white">{item.code}</span>,
    },
    {
      key: "name",
      header: "Currency Name",
      headerClassName: "text-left",
      cellClassName: "text-left",
      render: (item) => (
        <span className="text-gray-900 transition-none dark:text-white">{item.name}</span>
      ),
    },
    {
      key: "symbol",
      header: "Symbol",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => <span className="inline-flex min-w-8 justify-center rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-900 transition-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">{item.symbol}</span>,
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "active" ? "bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary" : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-white/70"}`}>
          {item.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex justify-center gap-2">
          <button onClick={() => openEdit(item)} className="rounded border border-primary px-2 py-1 text-xs text-primary transition-colors hover:bg-primary-50 dark:hover:bg-primary/20">Edit</button>
          <button onClick={() => setDeleteModal({ open: true, id: item.id, name: item.name })} className="rounded border border-secondary px-2 py-1 text-xs text-secondary transition-colors hover:bg-secondary-50 dark:hover:bg-secondary/20">Delete</button>
        </div>
      ),
    },
  ];

  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-primary/30";

  return (
    <div className="h-full bg-gray-50 p-6 transition-colors dark:bg-slate-950">
      <div className="mb-4">
        <h1 className="mb-0.5 text-xl font-semibold text-gray-900 dark:text-white">Currency Management</h1>
        <p className="text-xs text-gray-600 dark:text-white/70">Manage ISO currencies used across countries, fees, and exams</p>
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative min-w-0 w-full sm:w-60">
            <svg className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search currencies..." className={`${inputClass} py-1.5 pl-7 pr-8`} />
            {searchTerm !== debouncedSearch && <span className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>
          <ApnaSelect
            title=""
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All"
            options={[{ value: "", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            className="w-32 shrink-0"
            buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
          />
        </div>
        <button onClick={openAdd} className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Currency
        </button>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3 transition-colors dark:border-primary/30 dark:bg-primary/15">
          <p className="text-sm text-primary-800 dark:text-primary-100">
            <span className="font-semibold">{selectedItems.length}</span> item(s) selected
            <button onClick={() => setSelectedItems([])} className="ml-4 text-xs text-primary underline hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100">Clear Selection</button>
          </p>
        </div>
      )}

      <ApnaTable
        data={currencies}
        columns={columns}
        loading={loading}
        showSearch={false}
        showPagination
        itemsPerPage={8}
        maxPageButtons={5}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        striped
        hover
        bordered={false}
        compact
        showHeader
        emptyMessage="No currencies found"
        showSerialNumbers
        showCheckboxes
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onSelectAll={handleSelectAll}
        onPageChange={(page) => fetchCurrencies(page, debouncedSearch, statusFilter)}
      />

      <ApnaModal
        isOpen={formModal.open}
        onClose={closeForm}
        onSubmit={saveCurrency}
        title={formModal.mode === "add" ? "Add New Currency" : "Edit Currency"}
        submitText={saving ? "Saving..." : formModal.mode === "add" ? "Add Currency" : "Update Currency"}
        submitDisabled={saving}
        size="lg"
      >
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); saveCurrency(); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-white/80">Currency Name *<input name="name" value={formData.name} onChange={updateField} placeholder="Indian Rupee" className={`${inputClass} mt-2`} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80">ISO Code *<input name="code" value={formData.code} onChange={updateField} maxLength={3} placeholder="INR" className={`${inputClass} mt-2 uppercase`} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80">Symbol *<input name="symbol" value={formData.symbol} onChange={updateField} placeholder="Symbol" className={`${inputClass} mt-2`} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80">Display Order<input name="displayOrder" type="number" min="0" value={formData.displayOrder} onChange={updateField} className={`${inputClass} mt-2`} /></label>
          </div>
          <ApnaSelect
            title="Status"
            value={formData.status}
            onChange={(status) => setFormData((current) => ({ ...current, status }))}
            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            required
            portal
            labelClassName="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            buttonClassName="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left flex items-center justify-between text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:focus:ring-primary/30 cursor-pointer"
          />
        </form>
      </ApnaModal>

      <ApnaModalConfirmation
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        onConfirm={deleteCurrency}
        title="Delete Currency"
        message={`Are you sure you want to permanently delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete Currency"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        icon="danger"
      />
    </div>
  );
}
