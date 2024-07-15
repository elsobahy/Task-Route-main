import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar} from 'react-chartjs-2';
import 'chart.js/auto';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [transactionAmountFilter, setTransactionAmountFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersResponse = await axios.get('http://localhost:5000/customers');
        const transactionsResponse = await axios.get('http://localhost:5000/transactions');

        setCustomers(customersResponse.data);
        setTransactions(transactionsResponse.data);
        setFilteredCustomers(customersResponse.data);
      } catch (error) {
        console.error('There was an error fetching the data!', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [customerNameFilter, transactionAmountFilter]);

  const filterData = () => {
    let filtered = customers;

    if (customerNameFilter) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(customerNameFilter.toLowerCase())
      );
    }

    if (transactionAmountFilter) {
      filtered = filtered.filter(customer => {
        const customerTransactions = transactions.filter(transaction => 
          Number(transaction.customer_id) === Number(customer.id) && 
          transaction.amount === Number(transactionAmountFilter)
        );
        return customerTransactions.length > 0;
      });
    }

    setFilteredCustomers(filtered);
  };

  const getChartData = (customerId) => {
    const customerTransactions = transactions.filter(transaction => 
      Number(transaction.customer_id) === Number(customerId)
    );

    const transactionAmountsByDate = customerTransactions.reduce((acc, transaction) => {
      const date = transaction.date.split('T')[0]; 
      if (!acc[date]) acc[date] = 0;
      acc[date] += transaction.amount;
      return acc;
    }, {});

    const labels = Object.keys(transactionAmountsByDate);
    const data = Object.values(transactionAmountsByDate);

    return {
      labels,
      datasets: [
        {
          label: 'Total Transaction Amount',
          data,
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
        },
      ],
    };
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Customers and Transactions</h1>

      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Filter by customer name"
          value={customerNameFilter}
          onChange={(e) => setCustomerNameFilter(e.target.value)}
          className="mr-2 p-2 w-1/4 border border-gray-300 rounded"
        />
        <input
          type="number"
          placeholder="Filter by amount"
          value={transactionAmountFilter}
          onChange={(e) => setTransactionAmountFilter(e.target.value)}
          className="p-2 w-1/4  border border-gray-300 rounded"
        />
      </div>

      <p className="mb-4 bg-blue-100 mx-auto w-1/2 text-center rounded p-2">Please click on a customer row to display their transaction graph.</p>

      <div className="w-full md:max-w-5xl mx-auto">
        <table className="w-full border border-white border-4 divide-y divide-black bg-blue-100 rounded-lg shadow-lg">
          <thead className="bg-gray-200 rounded-t-lg">
            <tr>
              <th className="p-2 md:px-2 border border-white">Customer ID</th>
              <th className="p-2 md:px-2 border border-white">Customer Name</th>
              <th className="p-2 md:px-2 border border-white">Transaction ID</th>
              <th className="p-2 md:px-2 border border-white">Transaction Date</th>
              <th className="p-2 md:px-2 border border-white">Transaction Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => {
              const customerTransactions = transactions.filter(transaction => 
                Number(transaction.customer_id) === Number(customer.id)
              );
              return (
                <React.Fragment key={customer.id}>
                  {customerTransactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id}
                      className={selectedCustomer && selectedCustomer.id === customer.id ? 'bg-blue-300' : ''}
                      onClick={() => setSelectedCustomer(customer)}
                      style={{ cursor: 'pointer' }}
                    >
                      {index === 0 && (
                        <>
                          <td className="p-2 md:px-4 border border-white" rowSpan={customerTransactions.length}>{customer.id}</td>
                          <td className="p-2 md:px-4 border border-white" rowSpan={customerTransactions.length}>{customer.name}</td>
                        </>
                      )}
                      <td className="p-2 md:px-4 border border-white">{transaction.id}</td>
                      <td className="p-2 md:px-4 border border-white">{transaction.date}</td>
                      <td className="p-2 md:px-4 border border-white">{transaction.amount}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="w-full md:max-w-5xl mx-auto mt-5">
          <h2 className="text-xl font-bold text-center mb-4">Transaction Amounts for <span className='text-blue-400'>{selectedCustomer.name}</span></h2>
          <Bar data={getChartData(selectedCustomer.id)} />
        </div>
      )}
    </div>
  );
};

export default Customers;
