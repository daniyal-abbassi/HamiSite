import ContactForm from "@/components/forms/ContactForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Locate, Mail, Phone, Plane, PlaneTakeoff } from "lucide-react";
import React from "react";

const ContactPageOne = () => {
  return (
    <section className="max-w-screen-xl mx-auto p-2 md:p-8">
      <h2 className="text-4xl my-2 font-bold text-center">Get In Touch</h2>
      <div className="flex flex-col md:flex-row  md:max-h-[50rem] gap-4 overflow-hidden  dark:bg-slate-900 rounded-md shadow">
        
        {/* contact form */}
        <div className="w-full flex-1">
        <ContactForm />
        </div>
        {/* contect us information */}
        <div className=" bg-blue-600 w-full md:w-fit md:min-h-screen p-2 lg:p-8">
          <h3 className="text-xl font-semibold text-center mt-4">Contact Us</h3>
          <div className="flex items-center md:items-start w-full h-full justify-start mt-4 flex-col gap-6 md:text-xl">
            <div className="flex items-center gap-4">
              <Locate size={40} />
              <p className="whitespace-nowrap">gazipur, dhaka, bangladesh</p>
            </div>
            <div className="flex items-center gap-4 ">
              <Phone size={40} />
              <p>+1 000 000 000</p>
            </div>
            <div className="flex gap-4 items-center">
              <Mail size={40} />
              www.example@gmail.com{" "}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPageOne;
