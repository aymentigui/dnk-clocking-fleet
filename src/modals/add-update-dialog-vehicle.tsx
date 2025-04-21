"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useOrigin } from "@/hooks/use-origin";
import { useAddUpdateVehicleDialog } from "@/context/add-update-dialog-context-vehicle";
import { createVehicle } from "@/actions/vehicle/set";
import { UpdateVehicle } from "@/actions/vehicle/update";
import Select from "react-select";
import { getParksAdmin } from "@/actions/park/get";
import { useSession } from "@/hooks/use-session";
import { getRegionsAdmin } from "@/actions/region/get";

export const AddUpdateDialogVehicle = () => {
  const v = useTranslations("Vehicle");
  const t = useTranslations("System");
  const { isOpen, closeDialog, isAdd, vehicle } = useAddUpdateVehicleDialog();
  const [loading, setLoading] = useState(false);
  const [parks, setParks] = useState<any[]>([{ name: "----", id: "" }]);
  const [regions, setRegions] = useState<any[]>([{ name: "----", id: "" }]);
  const [hasPermissionAffectation, setHasPermissionAffectation] = useState(false);
  const [hasPermissionAffectation2, setHasPermissionAffectation2] = useState(false);
  const origin = useOrigin()
  const { session } = useSession()



  const schema = z.object({
    matricule: z.string().min(1, v("matriculerequired")),
    model: z.string().optional(),
    year: z.string().optional().refine((value) => value === null || value === '' || value === undefined || (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()), {
      message: v("yearinvalid"),
    }),
    brand: z.string().optional(),
    vin: z.string().optional(),
    park: z.string().optional(),
    region: z.string().optional(),
  });

  type formValues = z.infer<typeof schema>;

  const form = useForm<formValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricule: "",
      model: "",
      year: "",
      brand: "",
      vin: "",
      park: "",
    },
  });

  useEffect(() => {
    getParksAdmin().then((res) => {
      if (res && res.status === 200) {
        setParks([...parks, ...res.data])
      }
    });
    getRegionsAdmin().then((res) => {
      if (res && res.status === 200) {
        setRegions([...regions, ...res.data])
      }
    })
  }, []);

  useEffect(() => {
    if (vehicle) {
      form.setValue("matricule", vehicle.matricule ?? "");
      form.setValue("model", vehicle.model ?? "");
      form.setValue("year", vehicle.year ? String(vehicle.year) : "");
      form.setValue("brand", vehicle.brand ?? "");
      form.setValue("vin", vehicle.vin ?? "");
      form.setValue("park", vehicle.parkId);
      form.setValue("region", vehicle.regionId);
    }
  }, [vehicle])

  useEffect(() => {
    if (session) {
      setHasPermissionAffectation(isAdd ?
        (session?.user?.permissions.find((permission: string) => permission === "vehicles_park_create") ?? false) || session?.user?.is_admin
        : (session?.user?.permissions.find((permission: string) => permission === "vehicles_park_update") ?? false) || session?.user?.is_admin
      )
      setHasPermissionAffectation2(isAdd ?
        (session?.user?.permissions.find((permission: string) => permission === "vehicles_region_create") ?? false) || session?.user?.is_admin
        : (session?.user?.permissions.find((permission: string) => permission === "vehicles_region_update") ?? false) || session?.user?.is_admin
      )
    }
  }, [session])

  const onSubmit = async (data: formValues) => {
    if (!origin) return
    setLoading(true);
    let res;
    let message;
    let status;
    let errors;


    if (isAdd) {
      res = await createVehicle(data);
    } else {
      if (!vehicle) {
        toast.error(t("updatefail"));
        return
      }
      res = await UpdateVehicle(vehicle.id, data);
    }
    status = res.status
    message = res.data.message
    errors = res.data.errors

    if (status === 200) {
      toast.success(message ?? t("createsuccess"));
      closeDialog();
      form.reset();
      setLoading(false);
      window.location.reload()
    } else {
      setLoading(false);
      if (errors) {
        errors.map((err: any) => {
          toast.error(err.message);
        })
      } else {
        toast.error(message ?? (isAdd ? t("createfail") : t("updatefail")));
      }
    }
  };

  const handleClose = () => {
    closeDialog();
    setLoading(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[70%] max-w-[70%] flex flex-col h-[50%] lg:h-[70%]">
        <DialogHeader>
          <DialogTitle className="text-center">{isAdd ? v("addvehicle") : v("updatevehicle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ paddingInline: "1px", height: "100%" }} className="space-y-4 overflow-auto h-fit">
            <div className="px-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* matricule */}
                <FormField
                  control={form.control}
                  name="matricule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("matricule")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={v("matricule")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* model */}
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("model")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={v("model")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("year")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          placeholder={v("year")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* model */}
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("brand")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={v("brand")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("vin")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={v("vin")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {hasPermissionAffectation && <FormField
                  control={form.control}
                  name="park"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("park")}</FormLabel>
                      <FormControl>
                        <Select
                          options={
                            parks?.map((p) => ({
                              value: p.id,
                              label: p.name,
                            }))
                          }
                          value={
                            {
                              value: field.value,
                              label: parks?.find((p) => p.id === field.value)?.name,
                            }
                          }
                          onChange={(selectedOptions) => {
                            field.onChange(
                              selectedOptions ? selectedOptions.value : ""
                            );
                          }}
                          placeholder={v("selectpark")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />}
                {hasPermissionAffectation2 && <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{v("region")}</FormLabel>
                      <FormControl>
                        <Select
                          options={
                            regions?.map((p) => ({
                              value: p.id,
                              label: p.name,
                            }))
                          }
                          value={
                            {
                              value: field.value,
                              label: regions?.find((p) => p.id === field.value)?.name,
                            }
                          }
                          onChange={(selectedOptions) => {
                            field.onChange(
                              selectedOptions ? selectedOptions.value : ""
                            );
                          }}
                          placeholder={v("selectregion")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />}
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className={`w-full mt-4`}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAdd ? v("addvehicle") : v("updatevehicle")}
            </Button>
          </form>
          {/* <div className="w-full h-0 lg:h-10"></div> */}
        </Form>
      </DialogContent>
    </Dialog>
  );
};