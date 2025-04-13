"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAddUpdateParkDialog } from "@/context/add-update-dialog-context-park";
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
import { createPark } from "@/actions/park/set";
import { UpdatePark } from "@/actions/park/update";
import { Textarea } from "@/components/ui/textarea";


export const AddUpdateDialogPark = () => {
  const u = useTranslations("Park");
  const t = useTranslations("System");
  const { isOpen, closeDialog, isAdd, park } = useAddUpdateParkDialog();
  const [loading, setLoading] = useState(false);
  const origin = useOrigin()


  const schema = z.object({
    name: z.string().min(1, u("namerequired")),
    description: z.string().optional(),
    address: z.string().optional(),
});

  type formValues = z.infer<typeof schema>;

  const form = useForm<formValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
    },
  });

  useEffect(() => {
    if (park) {
      form.setValue("name", park.name ?? "");
      form.setValue("description", park.description ?? "");
      form.setValue("address", park.address ?? "");
    }
  }, [park])

  const onSubmit = async (data: formValues) => {
    if (!origin) return
    setLoading(true);
    let res;
    let message;
    let status;
    let errors;


    if (isAdd) {
      res = await createPark(data);
    } else {
      if (!park) return
      res = await UpdatePark(park.id, data);
    }

    status = res.status
    message = res.data.message
    errors = res.data.errors

    if (status === 200) {
      toast.success(message??t("createsuccess"));
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
        toast.error(message??t("createfail"));
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
      <DialogContent className="w-[70%] max-w-[70%] gb-r h-[50%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{isAdd ? u("addpark") : u("updatepark")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={u("name")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("address")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={u("address")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 my-4">
              {/* description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{u("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={u("description")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className={`w-full mt-4`}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAdd ? u("addpark") : u("updatepark")}
            </Button>
          </form>
          <div className="w-full h-20"></div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};