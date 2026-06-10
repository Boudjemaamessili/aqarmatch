import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetSellerInquiries, getGetSellerInquiriesQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { arDZ } from "date-fns/locale";
import { Building, Building2, Calendar, CheckCircle2, ChevronLeft, Inbox, MapPin, Search, Phone, Receipt, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const phoneSchema = z.object({
  phone: z.string().min(8, "الرجاء إدخال رقم هاتف صحيح").max(20, "رقم الهاتف طويل جداً"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function InquiriesPage() {
  const [submittedPhone, setSubmittedPhone] = useState("");

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const { data, isLoading, isError, error } = useGetSellerInquiries(submittedPhone, {
    query: {
      enabled: !!submittedPhone,
      queryKey: getGetSellerInquiriesQueryKey(submittedPhone),
      retry: false,
    },
  });

  const onSubmit = (values: PhoneFormValues) => {
    setSubmittedPhone(values.phone);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-DZ", {
      style: "currency",
      currency: "DZD",
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("د.ج.‏", "دج");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: arDZ });
    } catch {
      return dateString.split("T")[0];
    }
  };

  if (isError) {
    if ((error as any)?.status === 404) {
      toast.error("لم يتم العثور على عقارات لهذا الرقم. تحقق من الرقم أو أضف عقارك أولاً.");
    } else {
      toast.error("حدث خطأ أثناء جلب البيانات. الرجاء المحاولة مرة أخرى.");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 text-primary">
          <Inbox className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-4">استفساراتي</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          أدخل رقم هاتفك لعرض جميع عقاراتك ومتابعة محاولات التطابق والاستفسارات من المشترين المحتملين.
        </p>
      </div>

      <Card className="max-w-md mx-auto mb-12 shadow-sm border-primary/10">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="مثال: 0555123456"
                          className="pr-10 h-12 text-lg text-left"
                          dir="ltr"
                          data-testid="input-phone"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold"
                data-testid="button-submit-phone"
              >
                <Search className="w-5 h-5 ml-2" />
                عرض الاستفسارات
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {data && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Building className="w-8 h-8 text-primary mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي العقارات</p>
                <p className="text-3xl font-black">{data.total_listings}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الاستفسارات</p>
                <p className="text-3xl font-black">{data.total_inquiries}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">التطابقات الناجحة</p>
                <p className="text-3xl font-black">{data.total_matched}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2">تفاصيل العقارات والاستفسارات</h2>
            
            {data.listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden border-muted shadow-sm">
                <div className="bg-muted/30 p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={listing.deal_type === "بيع" ? "default" : "secondary"} className="text-sm px-3 py-1">
                        {listing.deal_type}
                      </Badge>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {listing.municipality}، {listing.wilaya}
                      </h3>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        أضيف في {formatDate(listing.created_at)}
                      </span>
                      {listing.neighborhoods.length > 0 && (
                        <span className="hidden md:inline-flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {listing.neighborhoods.join("، ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right md:text-left bg-background p-3 rounded-lg border shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">السعر المطلوب</p>
                    <p className="text-xl font-bold text-primary" dir="ltr">{formatPrice(listing.asking_price)}</p>
                  </div>
                </div>

                <div className="p-0">
                  {listing.matches.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow>
                            <TableHead className="text-right font-bold py-4">رقم المشتري</TableHead>
                            <TableHead className="text-right font-bold py-4">الميزانية المقترحة</TableHead>
                            <TableHead className="text-right font-bold py-4">النتيجة</TableHead>
                            <TableHead className="text-right font-bold py-4">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listing.matches.map((match) => (
                            <TableRow key={match.id} className="hover:bg-muted/5">
                              <TableCell className="font-medium" dir="ltr">{match.buyer_phone}</TableCell>
                              <TableCell dir="ltr">{formatPrice(match.budget)}</TableCell>
                              <TableCell>
                                {match.matched ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 gap-1 pr-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    تطابق
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground gap-1 pr-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    لم يتطابق
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(match.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>لم يتلق هذا العقار أي استفسارات أو محاولات تطابق حتى الآن.</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isError && (error as any)?.status === 404 && (
        <Card className="border-dashed border-2 bg-muted/20 mt-8">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-bold mb-2">لا توجد عقارات</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              لم يتم العثور على عقارات مرتبطة برقم الهاتف هذا. يرجى التحقق من الرقم أو إضافة عقارك أولاً.
            </p>
            <Button variant="outline" asChild>
              <a href="/listings/new">إضافة عقار جديد</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
