"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { createPark } from "@/actions/park/set";
import { UpdatePark } from "@/actions/park/update";
import { getPark } from "@/actions/park/get";
import toast from "react-hot-toast";

// Schéma de validation
const parkSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  description: z.string().optional(),
});

type ParkFormData = z.infer<typeof parkSchema>;

interface ParkFormProps {
  mode: "create" | "edit";
  parkId?: string;
}

export function ParkForm({ mode, parkId }: ParkFormProps) {
  const router = useRouter();
  const t = useTranslations("Park");
  const s = useTranslations("System");
  const e = useTranslations("Error");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");

  const form = useForm<ParkFormData>({
    resolver: zodResolver(parkSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
    },
  });

  // Charger les données du parc en mode édition
  useEffect(() => {
    if (mode === "edit" && parkId) {
      fetchPark();
    }
  }, [mode, parkId]);

  const fetchPark = async () => {
    try {
      const response = await getPark(parkId!);
      if (response.status === 200) {
        form.reset(response.data);
      } else {
        toast.error(e("fetchError"));
        router.push("/admin/parks");
      }
    } catch (error) {
      toast.error(e("fetchError"));
      router.push("/admin/parks");
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: ParkFormData) => {
    setIsLoading(true);
    
    try {
      let response;
      
      if (mode === "create") {
        response = await createPark(data);
      } else {
        response = await UpdatePark(parkId!, data);
      }

      if (response.status === 200) {
        toast.success(response.data.message || s("operationSuccess"));
        router.push("/admin/parks");
        router.refresh();
      } else {
        if (response.data.errors) {
          response.data.errors.forEach((error: any) => {
            toast.error(error.message);
          });
        } else {
          toast.error(response.data.message || s("operationFailed"));
        }
      }
    } catch (error) {
      toast.error(s("operationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="container mx-auto py-8">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/admin/parks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {s("back")}
          </Button>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {mode === "create" ? t("addpark") : t("updatepark")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {mode === "create" ? t("addparkDescription") : t("updateparkDescription")}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? t("parkInformation") : t("editParkInformation")}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")} *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("namePlaceholder")}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Adresse */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("addressPlaceholder")}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("descriptionPlaceholder")}
                        rows={4}
                        className="w-full resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {mode === "create" ? t("addpark") : t("updatepark")}
                </Button>
                
                <Link href="/admin/parks">
                  <Button type="button" variant="outline">
                    {s("cancel")}
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}