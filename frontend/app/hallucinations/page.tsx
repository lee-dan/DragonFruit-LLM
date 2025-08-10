"use client"

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  MessageCircle,
} from "lucide-react";
import { HallucinationChatModal } from "@/components/hallucination-chat-modal";

export default function HallucinationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hallucination Detection</h1>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>

        {/* Main Action Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={() => setIsModalOpen(true)}
            className="px-12 py-8 text-xl h-auto"
          >
            <MessageCircle className="w-6 h-6 mr-3" />
            Ask a Question!
          </Button>
        </div>



        {/* Chat Modal */}
        <HallucinationChatModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </DashboardLayout>
  );
} 