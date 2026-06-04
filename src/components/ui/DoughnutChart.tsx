'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { Rekening } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  rekeningen: Rekening[];
}

export default function DoughnutChart({ rekeningen }: Props) {
  const labels   = rekeningen.map(r => r.name);
  const balances = rekeningen.map(r => Math.max(0, r.balance));

  const data = {
    datasets: [
      {
        label: 'Rekeningen',
        data: balances.length > 0 ? balances : [1],
        backgroundColor: rekeningen.length > 0
          ? ['#0747b6', '#2265d8', '#2f91fa', '#06b6d4', '#8b5cf6']
          : ['#E5E7EB'],
        borderWidth: 0,
      },
    ],
    labels: labels.length > 0 ? labels : ['Geen rekeningen'],
  };

  return (
    <Doughnut
      data={data}
      options={{
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed as number;
                return ` €${val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
              },
            },
          },
        },
      }}
    />
  );
}
