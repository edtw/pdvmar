// utils/cleanupOrphanedData.js
// Script para limpar dados órfãos e inconsistentes

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Table = require('../models/Table');

/**
 * Limpar itens de pedidos fechados que ainda estão pendentes
 * (Corrige o bug de fechar mesa sem marcar itens como entregues)
 */
async function cleanupOrphanedItems() {
  try {
    console.log('[Cleanup] Iniciando limpeza de itens órfãos...');

    // 1. Buscar todos os pedidos fechados
    const closedOrders = await Order.find({ status: 'closed' }).select('_id items');
    let totalFixed = 0;
    let orphanedItems = [];

    if (closedOrders.length > 0) {
      const closedOrderIds = closedOrders.map(o => o._id);

      // Buscar itens de pedidos fechados que NÃO estão entregues
      orphanedItems = await OrderItem.find({
        order: { $in: closedOrderIds },
        status: { $in: ['pending', 'preparing', 'ready'] }
      });

      console.log(`[Cleanup] Encontrados ${orphanedItems.length} itens órfãos em pedidos fechados`);

      if (orphanedItems.length > 0) {
        // Marcar todos como entregues
        const result1 = await OrderItem.updateMany(
          {
            order: { $in: closedOrderIds },
            status: { $in: ['pending', 'preparing', 'ready'] }
          },
          {
            $set: {
              status: 'delivered',
              deliveryTime: new Date()
            }
          }
        );

        totalFixed += result1.modifiedCount;
        console.log(`[Cleanup] ✅ ${result1.modifiedCount} itens de pedidos fechados corrigidos!`);
      }
    }

    // 2. Marcar como entregues itens muito antigos (mais de 24 horas) que ainda estão pendentes
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const veryOldItems = await OrderItem.find({
      createdAt: { $lt: oneDayAgo },
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    console.log(`[Cleanup] Encontrados ${veryOldItems.length} itens muito antigos (>24h) ainda pendentes`);

    if (veryOldItems.length > 0) {
      const result2 = await OrderItem.updateMany(
        {
          createdAt: { $lt: oneDayAgo },
          status: { $in: ['pending', 'preparing', 'ready'] }
        },
        {
          $set: {
            status: 'delivered',
            deliveryTime: new Date()
          }
        }
      );

      totalFixed += result2.modifiedCount;
      console.log(`[Cleanup] ✅ ${result2.modifiedCount} itens antigos corrigidos!`);
    }

    console.log(`[Cleanup] ✅ Total de ${totalFixed} itens corrigidos!`);

    return {
      fixed: totalFixed,
      closedOrderItems: orphanedItems?.length || 0,
      oldItems: veryOldItems.length
    };
  } catch (error) {
    console.error('[Cleanup] Erro ao limpar itens órfãos:', error);
    throw error;
  }
}

/**
 * Limpar itens cancelados de pedidos ativos
 */
async function cleanupCanceledItems() {
  try {
    console.log('[Cleanup] Limpando itens cancelados...');

    const result = await OrderItem.deleteMany({
      status: 'canceled',
      createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Mais de 30 dias
    });

    console.log(`[Cleanup] ✅ ${result.deletedCount} itens cancelados antigos removidos`);

    return { deleted: result.deletedCount };
  } catch (error) {
    console.error('[Cleanup] Erro ao limpar itens cancelados:', error);
    throw error;
  }
}

/**
 * Corrigir mesas com status inconsistente
 */
async function cleanupTableStatus() {
  try {
    console.log('[Cleanup] Corrigindo status de mesas...');

    // Buscar mesas marcadas como ocupadas mas sem pedidos abertos
    const tables = await Table.find({ status: 'occupied' });
    let fixed = 0;

    for (const table of tables) {
      const openOrders = await Order.countDocuments({
        table: table._id,
        status: 'open'
      });

      if (openOrders === 0) {
        table.status = 'available';
        table.currentOrder = null;
        table.waiter = null;
        await table.save();
        fixed++;
        console.log(`[Cleanup] Mesa ${table.number} corrigida (estava ocupada sem pedidos)`);
      }
    }

    console.log(`[Cleanup] ✅ ${fixed} mesas corrigidas`);

    return { fixed };
  } catch (error) {
    console.error('[Cleanup] Erro ao corrigir status de mesas:', error);
    throw error;
  }
}

/**
 * Executar todas as limpezas
 */
async function runFullCleanup() {
  console.log('\n========================================');
  console.log('🧹 INICIANDO LIMPEZA COMPLETA DO BANCO');
  console.log('========================================\n');

  try {
    const results = {
      orphanedItems: await cleanupOrphanedItems(),
      canceledItems: await cleanupCanceledItems(),
      tableStatus: await cleanupTableStatus()
    };

    console.log('\n========================================');
    console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('========================================');
    console.log('Resumo:');
    console.log(`- Itens órfãos corrigidos: ${results.orphanedItems.fixed}`);
    console.log(`- Itens cancelados removidos: ${results.canceledItems.deleted}`);
    console.log(`- Mesas corrigidas: ${results.tableStatus.fixed}`);
    console.log('========================================\n');

    return results;
  } catch (error) {
    console.error('\n❌ ERRO NA LIMPEZA:', error);
    throw error;
  }
}

module.exports = {
  cleanupOrphanedItems,
  cleanupCanceledItems,
  cleanupTableStatus,
  runFullCleanup
};
