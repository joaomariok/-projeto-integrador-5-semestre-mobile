import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, Pressable } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import api from './api'

const chartConfig = {
  backgroundColor: '#121214',
  decimalPlaces: 0, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  barPercentage: 1,
  style: {
    borderRadius: 16
  }
}

const LIST_OF_LABELS = ["Baixa", "Média", "Alta"];
const LIST_OF_RANGES = [6, 12, 24, 48];

export default function App() {

  const [list, setList] = useState([]);
  const [averageHours, setAverageHours] = useState([]);
  const [entries, setEntries] = useState([]);
  const [dataGravidade, setDataGravidade] = useState();

  const [permanencias, setPermanencias] = useState([]);
  const [valores, setValores] = useState([]);
  const [dataHorasDeEspera, setDataHorasDeEspera] = useState();

  function getPermanenciasLabelsForChart() {
    const list = LIST_OF_RANGES;
    const labels = Array(list.length + 1).fill('');

    for (let i = 0; i < labels.length; i++) {
      if (i === 0) {
        labels[i] = `Até ${list[i]}h`;// (${permanencias[i]}/${valores.length})`;
      }
      else if (i === labels.length - 1) {
        labels[i] = `Mais de ${list[i - 1]}h`;// (${permanencias[i]}/${valores.length})`;
      }
      else {
        labels[i] = `${list[i - 1]}h a ${list[i]}h`;// (${permanencias[i]}/${valores.length})`;
      }
    }

    return labels;
  }

  function getListOfRanges(values) {
    const rangeCount = Array(LIST_OF_RANGES.length + 1).fill(0);
    const ranges = LIST_OF_RANGES.map((i) => i * 60);

    values.forEach((value) => {
      for (let range = 0; range < ranges.length; range++) {
        if (value <= ranges[range]) {
          rangeCount[range]++;
          break;
        }

        if (ranges[range] === ranges[3]) {
          rangeCount[rangeCount.length - 1]++;
          break;
        }
      }
    });

    return rangeCount;
  }

  function convertMinutesToHours(min) {
    return min / 60;
  }

  function getAverageWaitingTime(values) {
    return values.reduce((prev, curr) => prev + curr) / values.length;
  }

  function getFormattedTime(h) {
    const hours = Math.floor(h);
    const minutes = Math.round((h - Math.floor(h)) * 60);

    return `${hours}h ${minutes}min`;
  }

  function getGravidadeLabelsWithValues() {
    const list = [];
    for (let i = 0; i < LIST_OF_LABELS.length; i++) {
      list.push(`${LIST_OF_LABELS[i]} (${getFormattedTime(averageHours[i])})`);
    }
    return list;
  }

  async function fetchDataHorasDeEspera() {
    const { data } = await api.get("/permanence");

    const listOfValues = data.map((i) => i.permanencia);
    setValores(listOfValues);

    const listOfRanges = getListOfRanges(listOfValues);
    setPermanencias(listOfRanges);

    setDataHorasDeEspera({
      labels: getPermanenciasLabelsForChart(),
      datasets: [
        {
          data: permanencias,
        },
      ],
    });
  }

  async function fetchDataGravidade() {
    const { data } = await api.get("/severity-and-permanence");
    setList(data);

    const averagePermanence = LIST_OF_LABELS.map((label) => {
      const filteredData = data
        .filter((value) => value.gravidade === label)
        .map((d) => d.permanencia);

      return filteredData.length > 0 ?
        getAverageWaitingTime(filteredData) :
        0;
    });

    const averageHoursTemp = averagePermanence.map((i) => convertMinutesToHours(i));
    setAverageHours(averageHoursTemp);

    const entriesNumber = LIST_OF_LABELS.map((label) => {
      const d = data.filter((value) => value.gravidade === label)
      return d.length;
    });
    setEntries(entriesNumber);

    setDataGravidade({
      labels: getGravidadeLabelsWithValues(),
      datasets: [
        {
          data: averageHours,
        },
      ],
    });
  }

  const fetchAll = useCallback(async () => {
    await fetchDataGravidade();
    await fetchDataHorasDeEspera();
  });

  useLayoutEffect(() => {
    fetchAll();
    console.log('useEffect');
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: '#e1e1e6',
      fontSize: 34,
    },
    subtitle: {
      color: '#e1e1e6',
      fontSize: 20,
      marginTop: 15,
      marginBottom: 10,
    },
    button: {
      marginTop: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 5,
      paddingHorizontal: 40,
      borderRadius: 4,
      elevation: 3,
      backgroundColor: '#FFCD1E',
    },
    text: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: 'bold',
      letterSpacing: 0.25,
      color: 'black',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar translucent barStyle="light-content" backgroundColor="#121214" />
      <Text style={styles.title}>UPA São Carlos</Text>
      {dataHorasDeEspera && <Text style={styles.subtitle}>Ocorrências por Faixa de permanência</Text>}
      {dataHorasDeEspera && <BarChart
        data={dataHorasDeEspera}
        width={Dimensions.get('window').width - 16}
        height={220}
        fromZero={true}
        showValuesOnTopOfBars={true}
        chartConfig={chartConfig}
      />}
      {dataGravidade && <Text style={styles.subtitle}>Permanência média por Gravidade</Text>}
      {dataGravidade && <BarChart
        data={dataGravidade}
        width={Dimensions.get('window').width - 16}
        height={220}
        fromZero={true}
        chartConfig={chartConfig}
      />}
      <Pressable style={styles.button} onPress={fetchAll}>
        <Text style={styles.text}>Atualizar</Text>
      </Pressable>
    </View>
  );
}
