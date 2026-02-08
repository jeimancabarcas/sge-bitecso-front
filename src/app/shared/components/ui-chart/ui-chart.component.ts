// Reusable Chart Component supporting Doughnut and Bar charts
import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-ui-chart',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="relative w-full h-[220px] flex items-center justify-center overflow-hidden">
      <!-- Always show canvas if not explicitly loading -->
      <canvas #chartCanvas [class.hidden]="loading"></canvas>
      
      <!-- Loading Overlay -->
      <div *ngIf="loading" class="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/20 backdrop-blur-[2px] rounded-[var(--radius-md)]">
        <div class="flex space-x-1.5">
          <div class="w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-bounce"></div>
          <div class="w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div class="w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !hasData" class="absolute inset-0 flex flex-col items-center justify-center text-[var(--muted)] pointer-events-none">
          <div class="bg-[var(--surface)]/10 p-6 rounded-2xl flex flex-col items-center border border-white/5 backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2001/svg" class="w-10 h-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="text-[10px] uppercase tracking-[0.2em] font-mono opacity-40">Sin datos registrados</span>
          </div>
      </div>
    </div>
  `
})
export class UiChartComponent implements OnChanges, AfterViewInit, OnDestroy {
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    @Input() type: 'doughnut' | 'bar' = 'doughnut';
    @Input() data: any[] = []; // Changed to any[] to support multiple datasets
    @Input() labels: string[] = [];
    @Input() colors: string | string[] | any[] = [];
    @Input() loading: boolean = false;
    @Input() label: string = 'Registros';

    private chart: Chart | null = null;

    get hasData(): boolean {
        if (!this.data || this.data.length === 0) return false;

        // If we have an array, we have data to try and draw
        return true;
    }

    constructor() { }

    ngAfterViewInit() {
        // Small timeout to ensure container has dimensions
        setTimeout(() => this.createChart(), 50);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.chart) {
            const typeChanged = !!changes['type'];
            const dataChanged = !!changes['data'];
            const labelsChanged = !!changes['labels'];

            // If datasets count or labels count changed, recreate for safety
            const prevData = changes['data']?.previousValue;
            const currData = changes['data']?.currentValue;
            const dataCountChanged = prevData?.length !== currData?.length;

            if (typeChanged || dataCountChanged) {
                this.safeDestroyChart();
                setTimeout(() => this.createChart(), 0);
            } else if (dataChanged || labelsChanged) {
                this.updateChart();
            }
        } else if (this.hasData) {
            setTimeout(() => this.createChart(), 50);
        }
    }

    ngOnDestroy() {
        this.safeDestroyChart();
    }

    private safeDestroyChart() {
        const chartInstance = this.chart as any;
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            chartInstance.destroy();
        }
        this.chart = null;
    }

    private createChart() {
        if (!this.chartCanvas || !this.chartCanvas.nativeElement) return;

        this.safeDestroyChart();

        const isBar = this.type === 'bar';

        // Support for multiple datasets
        let datasets = [];
        if (isBar && this.data.length > 0 && typeof this.data[0] === 'object' && this.data[0].data) {
            // Mode: Multiple datasets
            datasets = this.data.map((ds, i) => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: (Array.isArray(this.colors) && this.colors[i]) ? this.colors[i] : (Array.isArray(this.colors) ? this.colors[0] : this.colors),
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 4,
                barThickness: 12,
                maxBarThickness: 15
            }));
        } else {
            // Mode: Single dataset
            datasets = [{
                label: this.label,
                data: this.data,
                backgroundColor: this.colors,
                borderColor: 'transparent',
                borderWidth: 0,
                hoverOffset: isBar ? 0 : 10,
                borderRadius: 4,
                barThickness: isBar ? 12 : undefined
            }];
        }

        const config: ChartConfiguration = {
            type: this.type,
            data: {
                labels: this.labels,
                datasets: datasets as any
            },
            options: {
                indexAxis: isBar ? 'y' : 'x',
                cutout: !isBar ? '70%' : undefined,
                responsive: true,
                maintainAspectRatio: false,
                scales: isBar ? {
                    x: {
                        grid: { display: true, color: 'rgba(255,255,255,0.03)' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'monospace', size: 10 },
                            stepSize: 1,
                            precision: 0
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: '#e2e8f0',
                            font: { size: 9 },
                            autoSkip: false,
                            maxRotation: 0
                        }
                    }
                } : {
                    y: {
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: isBar && datasets.length > 1,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'monospace', size: 9 },
                            boxWidth: 8,
                            boxHeight: 8,
                            padding: 10,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleFont: { family: '"Outfit", sans-serif', size: 12, weight: 'bold' },
                        bodyFont: { family: '"Outfit", sans-serif', size: 11 },
                        padding: 12,
                        cornerRadius: 8,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: true
                    }
                }
            } as any
        };

        this.chart = new Chart(this.chartCanvas.nativeElement, config);
    }

    private updateChart() {
        if (this.chart && this.hasData) {
            this.chart.data.labels = this.labels;
            if (typeof this.data[0] === 'object' && this.data[0].data) {
                this.data.forEach((ds, i) => {
                    if (this.chart!.data.datasets[i]) {
                        this.chart!.data.datasets[i].data = ds.data;
                        this.chart!.data.datasets[i].label = ds.label;
                    }
                });
            } else {
                this.chart.data.datasets[0].data = this.data;
                this.chart.data.datasets[0].backgroundColor = this.colors as any;
            }
            this.chart.update('active');
        } else if (this.hasData) {
            this.createChart();
        }
    }
}
