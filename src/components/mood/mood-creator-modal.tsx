'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/modal/dialog';
import { MoodCreator } from './mood-creator';

interface MoodCreatorModalProps {
  trigger: ReactNode;
}

export function MoodCreatorModal({ trigger }: MoodCreatorModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <MoodCreator />
      </DialogContent>
    </Dialog>
  );
}
