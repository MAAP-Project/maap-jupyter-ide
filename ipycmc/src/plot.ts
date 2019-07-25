import moment from 'moment';

export function generatePlotCommand(commandInfo: {
    plotType: string;
    startDate: Date;
    endDate: Date;
    geometry: any;
    datasets: Array<string>;
}) {
    const { plotType, startDate, endDate, geometry, datasets } = commandInfo;
    return [
        `# Initialize parameter variables`,
        `plotType = "${plotType}"`,
        `startDate = "${moment(startDate)
            .utc()
            .toISOString()}"`,
        `endDate = "${moment(endDate)
            .utc()
            .toISOString()}"`,
        `ds = [${datasets.map((l: string) => '"' + l + '"').join(', ')}]`,
        `geometry = ${JSON.stringify(geometry)}`,
        `# Retrieve the data`,
        `data = ipycmc.retrieve_data(plotType, startDate, endDate, ds, geometry)`,
        `# Plot the data`,
        `ipycmc.plot_data(plotType, data)`,
    ].join('\n');
}
