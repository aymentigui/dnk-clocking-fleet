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
import Select from "react-select";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAddUpdateDeviceDialog } from "@/context/add-update-dialog-context-device";
import { getParksAdmin } from "@/actions/park/get";
import { createDevice } from "@/actions/device/set";
import { UpdateDevice } from "@/actions/device/update";
import { getRegionsAdmin } from "@/actions/region/get";

type Park = {
  id: string;
  name: string;
};

type Region = {
  id: string;
  name: string;
};


export const AddUpdateDeviceDialog = () => {
  const u = useTranslations("Device");
  const t = useTranslations("System");
  const { isOpen, closeDialog, isAdd, device } = useAddUpdateDeviceDialog();
  const [parks, setParks] = useState<any[]>([{ name: "----", id: "" }]);
  const [regions, setRegions] = useState<any[]>([{ name: "----", id: "" }]);
  const [loading, setLoading] = useState(false);

  const types = [
    { id: 0, name: u("devicesortie") },
    { id: 1, name: u("deviceentree") },
    { id: 2, name: u("devicesortieentree") },
    { id: 3, name: u("devicecontroller") },
  ];


  const schema = z.object({
    code: z.string().min(1, u("coderequired")),
    username: z.string().min(1, u("usernamerequired")).refine(username => !username.includes(' '), {
      message: u("usernamecontainspace")
    }),
    password: z.string().min(6, u("password6")),
    park: z.string().optional(),
    region: z.string().optional(),
    type: z.number().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: device?.code ?? "",
      username: device?.username ?? "",
      password: device?.password ?? "",
      park: device?.park ?? "",
      region: device?.region ?? "",
      type: device?.type ?? 0,
    },
  });

  const { watch } = form;
  const type = watch("type");

  useEffect(() => {
    getParksAdmin().then((res) => {
      if (res && res.status === 200) {
        setParks(res.data)
      }
    });
    getRegionsAdmin().then((res) => {
      if (res && res.status === 200) {
        setRegions(res.data)
      }
    });
  }, []);

  useEffect(() => {
    if (device) {
      form.setValue("code", device.code);
      form.setValue("username", device.username)
      form.setValue("password", device.password)
      form.setValue("park", device.parkId);
      form.setValue("region", device.regionId);
      form.setValue("type", device.type);
    }
  }, [device])


  useEffect(() => {
    if (type === 0 || type === 1 || type === 2) {
      form.setValue("region", undefined);
    }
    if (type === 3) {
      form.setValue("park", undefined);
    }
  }, [type])

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    let res;
    let message;
    let status;
    let errors;

    console.log(data)
    if (isAdd) {
      res = await createDevice(data);
    } else if (device) {
      res = await UpdateDevice(device.id, data);
    }
    else {
      toast.error(t("updatefail"));
      return
    }

    status = res.status
    message = res.data.message
    errors = res.data.errors

    if (status === 200) {
      toast.success(message?? (isAdd ? t("createsuccess") : t("updatesuccess")));
      closeDialog();
      form.reset();
      setLoading(false);
      //window.location.reload()
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
          <DialogTitle className="text-center">{isAdd ? u("adddevice") : u("updatedevice")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ paddingInline: "1px", height: "100%" }} className="space-y-4 overflow-auto h-fit px-1">
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("code")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={u("code")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("username")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={u("username")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-2 mt-2 gap-4">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        placeholder={u("password")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("type")}</FormLabel>
                    <FormControl>
                      <Select
                        options={
                          types?.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))
                        }
                        value={
                          {
                            value: field.value,
                            label: types?.find((t) => t.id === field.value)?.name,
                          }
                        }
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions ? selectedOptions.value : ""
                          );
                        }}
                        placeholder={u("selecttype")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {type !== 3 && <FormField
                control={form.control}
                name="park"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("park")}</FormLabel>
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
                        placeholder={u("selectpark")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />}
              {type === 3 && <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("region")}</FormLabel>
                    <FormControl>
                      <Select
                        options={
                          regions?.map((r) => ({
                            value: r.id,
                            label: r.name,
                          }))
                        }
                        value={
                          {
                            value: field.value,
                            label: regions?.find((r) => r.id === field.value)?.name,
                          }
                        }
                        onChange={(selectedOptions) => {
                          field.onChange(
                            selectedOptions ? selectedOptions.value : ""
                          );
                        }}
                        placeholder={u("selectregion")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />}
            </div>

            {/* Submit Button */}
            <Button type="submit" className={`w-full mt-4`}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAdd ? u("adddevice") : u("updatedevice")}
            </Button>
          </form>
          {/* <div className="w-full h-20"></div> */}
        </Form>
      </DialogContent>
    </Dialog>
  );
};