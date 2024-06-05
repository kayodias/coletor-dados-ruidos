document.addEventListener('DOMContentLoaded', () => {
    const noiseLevel = document.getElementById('noise-level');
    const noiseChart = document.getElementById('noise-chart').getContext('2d');
    const startButton = document.getElementById('start-button');

    let recording = false;
    let audioData = [];
    let timeElapsed = 0;

    // Configuração do gráfico
    const chart = new Chart(noiseChart, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Decibéis',
                data: [],
                borderColor: 'blue',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tempo (s)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Decibéis (dB)'
                    },
                    min: 0, // Define o valor mínimo do eixo y
                    max: 150, // Define o valor máximo do eixo y
                }
            }
        }
    });

    // Iniciar a captura de áudio
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            microphone.connect(analyser);
            analyser.connect(audioContext.destination);

            // Desconecte o analisador do destino do contexto de áudio para evitar a reprodução
            analyser.disconnect(audioContext.destination);

            analyser.fftSize = 4096;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Atualiza o gráfico a cada segundo durante a gravação
            function updateChart() {
                analyser.getByteFrequencyData(dataArray);
                const averageDecibel = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

                // Se a gravação estiver ativa, adicione os dados ao array de áudio
                if (recording) {
                    audioData.push(averageDecibel);
                    timeElapsed += 1; // Incrementa o tempo em 1 segundo
                    chart.data.labels.push(timeElapsed);
                    chart.data.datasets[0].data.push(averageDecibel);
                    chart.update();
                }
            }

let updateInterval; // Adicione esta variável global para rastrear o intervalo

// Iniciar a gravação quando o botão for clicado
startButton.addEventListener('click', () => {
    if (!recording) {
        // Limpar os dados existentes no gráfico
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();

        // Limpar o intervalo anterior, se existir
        if (updateInterval) {
            clearInterval(updateInterval);
        }

        recording = true;
        audioData = [];
        timeElapsed = 0;
        noiseLevel.textContent = 'Nível de Ruído: Gravando...';
        
        // Defina o intervalo apenas uma vez após a limpeza
        updateInterval = setInterval(updateChart, 1000); // Atualiza a cada 1 segundo
        
        setTimeout(() => {
            recording = false;
            const avgDecibel = audioData.reduce((acc, val) => acc + val, 0) / audioData.length;
            classifyNoise(avgDecibel);
        }, 5000); // Grava por 5 segundos
    }
});

        })
        .catch((error) => {
            console.error('Erro ao acessar o microfone:', error);
        });

    // Função para classificar o nível de ruído
    function classifyNoise(avgDecibel) {
        const averageDecibelElement = document.getElementById('average-decibel');
        averageDecibelElement.textContent = `Média de Decibéis: ${avgDecibel.toFixed(2)} dB`;

        if (avgDecibel <= 30) {
            noiseLevel.textContent = 'Nível de Ruído: Baixo';
        } else if (avgDecibel <= 60) {
            noiseLevel.textContent = 'Nível de Ruído: Moderado';
        } else if (avgDecibel <= 80) {
            noiseLevel.textContent = 'Nível de Ruído: Alto';
        } else if (avgDecibel <= 90) {
            noiseLevel.textContent = 'Nível de Ruído: Muito Alto';
        } else {
            noiseLevel.textContent = 'Nível de Ruído: Extremamente Alto';
        }
    }
}); 
