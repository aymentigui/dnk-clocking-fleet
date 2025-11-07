"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ParksTable } from "../_component/ParkTable";
import { useOrigin } from "@/hooks/use-origin";
import { getParks } from "@/actions/park/get";
import { deletePark } from "@/actions/park/delete";
import toast from "react-hot-toast";

interface Park {
  id: string;
  name: string;
  address?: string;
  description?: string;
}

export default function ParksListPage() {
  const t = useTranslations("Park");
  const e = useTranslations("Error");
  
  const origin = useOrigin();
  
  const [parks, setParks] = useState<Park[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchParks();
  }, [origin]);

  const fetchParks = async () => {
    try {
      if (!origin) return;
      setIsLoading(true);
      const response = await getParks();
      if (response.status === 200) {
        setParks(response.data);
      }
    } catch (error) {
      console.error("Error fetching parks:", error);
      toast.error(e("fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePark = async (parkId: string) => {
    if (!confirm(t("confirmDeleteSingle"))) return;
    
    try {
      const response = await deletePark([parkId]);
      if (response.status === 200) {
        toast.success(response.data.message);
        fetchParks(); // Rafraîchir la liste
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(e("deleteError"));
    }
  };

  const filteredParks = parks.filter(park =>
    park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    park.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    park.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Tableau des parcs */}
      <ParksTable
        parks={filteredParks}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        isLoading={isLoading}
        onDelete={handleDeletePark}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}