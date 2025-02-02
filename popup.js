document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('extractButton').addEventListener('click', extractColumns);
document.getElementById('copyButton').addEventListener('click', copyToClipboard);
document.getElementById('copyFullButton').addEventListener('click', copyFullFile);
document.getElementById('clearButton').addEventListener('click', clearData);

let df = null;
let extractedDf = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = e.target.result;
      if (file.name.endsWith('.csv')) {
        df = parseCSV(data);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parseExcel(data).then(parsedData => {
          df = parsedData;
          updatePreview(df);
        });
      }
    };
    reader.readAsBinaryString(file);
  }
}

function parseCSV(data) {
  const rows = data.split('\n').map(row => row.split(','));
  const headers = rows[0];
  const df = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  return df;
}

function parseExcel(data) {
  return new Promise((resolve, reject) => {
    const workbook = XLSX.read(data, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);
    resolve(json);
  });
}

function updatePreview(data) {
  const table = document.getElementById('previewTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    data.slice(0, 5).forEach(row => {
      const tr = document.createElement('tr');
      headers.forEach(header => {
        const td = document.createElement('td');
        td.textContent = row[header];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
}

function extractColumns() {
  if (!df) {
    alert("Please select a file first");
    return;
  }

  const requiredColumns = ['Barcode', 'Spec Stock Number', 'Description', 'Quantity', 'SRP'];
  const availableColumns = Object.keys(df[0]);
  const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

  if (missingColumns.length > 0) {
    alert(`The following required columns are missing from the file:\n${missingColumns.join(', ')}`);
    return;
  }

  const columnMapping = {
    'Barcode': '12-DigitBarcode',
    'Spec Stock Number': 'StockNo',
    'Description': 'Item Description',
    'Quantity': 'Quantity',
    'SRP': 'Price',
    'SuppCode': 'SuppCode',
    'Batchdate': 'Batchdate'
  };

  const orderedColumns = [
    'Barcode',
    'Spec Stock Number',
    'Description',
    'SuppCode',
    'Batchdate',
    'Quantity',
    'SRP'
  ];

  extractedDf = df.map(row => {
    const newRow = {};
    orderedColumns.forEach(col => {
      if (col === 'SuppCode' || col === 'Batchdate') {
        newRow[columnMapping[col]] = row[col] || '';
      } else {
        newRow[columnMapping[col]] = row[col];
      }
    });
    return newRow;
  });

  document.getElementById('copyButton').disabled = false;
  updatePreview(extractedDf);
}

function copyToClipboard() {
  let clipboardStr = '';

  if (extractedDf) {
    const headers = Object.keys(extractedDf[0]).join('\t');
    const rows = extractedDf.map(row => Object.values(row).join('\t')).join('\n');
    clipboardStr = headers + '\n' + rows;
  } else if (df) {
    const headers = Object.keys(df[0]).join('\t');
    const rows = df.map(row => Object.values(row).join('\t')).join('\n');
    clipboardStr = headers + '\n' + rows;
  } else {
    alert("No data to copy. Please load a file first.");
    return;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(clipboardStr).then(() => {
    document.getElementById('statusLabel').textContent = "Content copied to clipboard successfully!";
  }).catch(err => {
    alert(`Could not copy to clipboard: ${err}`);
  });
}

function copyFullFile() {
  if (df) {
    const headers = Object.keys(df[0]).join('\t');
    const rows = df.map(row => Object.values(row).join('\t')).join('\n');
    const clipboardStr = headers + '\n' + rows;

    navigator.clipboard.writeText(clipboardStr).then(() => {
      document.getElementById('statusLabel').textContent = "Full file content copied to clipboard successfully!";
    }).catch(err => {
      alert(`Could not copy to clipboard: ${err}`);
    });
  } else {
    alert("No data to copy. Please load a file first.");
  }
}

function clearData() {
  df = null;
  extractedDf = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('copyButton').disabled = true;
  document.getElementById('statusLabel').textContent = '';
  updatePreview([]);
}